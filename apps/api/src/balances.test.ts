import { describe, expect, it } from "vitest";
import { createTestApp, signedUp } from "./test/app.ts";
import { addExpense, addGroupExpense, friendPage } from "./test/expenses.ts";
import { createGroup, getGroup, json, personId, type Browser } from "./test/groups.ts";

type Friend = { personId: string; email: string; netBalances: { currency: string; amount: number }[] };
const friends = async (b: Browser) => (await json<{ friends: Friend[] }>(b.get("/api/friends"))).friends;
const netWith = async (b: Browser, email: string) => (await friends(b)).find((f) => f.email === email)!.netBalances;

describe("balances from Expenses", () => {
  it("nets Debts both ways, across Groups and outside them: I owe ₹125, Ben owes me ₹100 → I owe ₹25", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const [a, b] = [await personId(asha), await personId(ben)];
    const { id: goa } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com"] });

    // Ben paid ₹250 for both of us in the Group: I owe ₹125.
    await addGroupExpense(ben, goa, { description: "Hotel", amount: "250", payerId: b, participantIds: [a, b] });
    // I paid ₹200 for both of us outside any Group: Ben owes me ₹100.
    await addExpense(asha, { description: "Cab", amount: "200", payerId: a, participants: [{ personId: a }, { personId: b }] });

    expect(await netWith(asha, "ben@example.com")).toEqual([{ currency: "INR", amount: -2500 }]);
    expect(await netWith(ben, "asha@example.com")).toEqual([{ currency: "INR", amount: 2500 }]);
  });

  it("never adds different currencies together", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    await asha.post("/api/friends", { email: "ben@example.com" });
    const [a, b] = [await personId(asha), await personId(ben)];

    await addExpense(asha, { description: "Chai", amount: "300", currency: "INR", payerId: a, participants: [{ personId: a }, { personId: b }] });
    await addExpense(ben, { description: "Croissants", amount: "12", currency: "EUR", payerId: b, participants: [{ personId: a }, { personId: b }] });

    expect(await netWith(asha, "ben@example.com")).toEqual([
      { currency: "EUR", amount: -600 },
      { currency: "INR", amount: 15000 },
    ]);
  });

  it("Group Balances and Group Debts, worked by hand; they add up to zero and mirror each other", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const chen = await signedUp(app, "Chen");
    await signedUp(app, "Divya");
    const { id: goa } = await createGroup(asha, { name: "Goa", memberEmails: ["ben@example.com", "chen@example.com", "divya@example.com"] });
    const [A, B, C, D] = (await getGroup(asha, goa)).members.map((m) => m.personId) as [string, string, string, string];

    // E1: Asha pays ₹1200 for all four → Ben, Chen, Divya each owe Asha ₹300.
    await addGroupExpense(asha, goa, { description: "Dinner", amount: "1200", payerId: A, participantIds: [A, B, C, D] });
    // E2: Ben pays ₹600 for Ben and Chen → Chen owes Ben ₹300.
    await addGroupExpense(ben, goa, { description: "Kayaks", amount: "600", payerId: B, participantIds: [B, C] });
    // E3: Chen pays ₹400 for Asha and Chen → Asha owes Chen ₹200.
    await addGroupExpense(chen, goa, { description: "Snacks", amount: "400", payerId: C, participantIds: [A, C] });

    const group = (await json<{
      members: { personId: string; groupBalances: { currency: string; amount: number }[] }[];
      debts: { fromId: string; toId: string; currency: string; amount: number }[];
    }>(asha.get(`/api/groups/${goa}`)));

    // Asha: +900 − 200 = +700 · Ben: −300 + 300 = 0 · Chen: −300 − 300 + 200 = −400 · Divya: −300
    expect(group.members.map((m) => m.groupBalances)).toEqual([
      [{ currency: "INR", amount: 70000 }],
      [],
      [{ currency: "INR", amount: -40000 }],
      [{ currency: "INR", amount: -30000 }],
    ]);
    const total = group.members.flatMap((m) => m.groupBalances).reduce((sum, b) => sum + b.amount, 0);
    expect(total).toBe(0);

    // Who owes whom: Chen's ₹300 to Asha nets against Asha's ₹200 to Chen.
    const names = { [A]: "Asha", [B]: "Ben", [C]: "Chen", [D]: "Divya" };
    expect(group.debts.map((d) => [names[d.fromId], names[d.toId], d.amount])).toEqual([
      ["Ben", "Asha", 30000],
      ["Chen", "Asha", 10000],
      ["Chen", "Ben", 30000],
      ["Divya", "Asha", 30000],
    ]);

    expect(await netWith(asha, "chen@example.com")).toEqual([{ currency: "INR", amount: 10000 }]);
    expect(await netWith(chen, "asha@example.com")).toEqual([{ currency: "INR", amount: -10000 }]);
  });

  it("Spec 01's guards hold against real Debts: archive, leave, remove member, remove Friend", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const [a, b] = [await personId(asha), await personId(ben)];
    const { id: goa } = await createGroup(asha, { name: "Goa", memberEmails: ["ben@example.com"] });
    await addGroupExpense(asha, goa, { description: "Hotel", amount: "1000", payerId: a, participantIds: [a, b] });

    expect((await asha.post(`/api/groups/${goa}/archive`)).status).toBe(400);
    expect((await ben.post(`/api/groups/${goa}/leave`)).status).toBe(400);
    expect((await asha.delete(`/api/groups/${goa}/members/${b}`)).status).toBe(400);

  });

  it("a real Net Balance alone blocks removing a Friend (no shared Group)", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    await asha.post("/api/friends", { email: "ben@example.com" });
    const [a, b] = [await personId(asha), await personId(ben)];
    await addExpense(asha, { description: "Cab", amount: "300", payerId: a, participants: [{ personId: a }, { personId: b }] });

    const res = await ben.delete(`/api/friends/${a}`);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/settled up/i) });
  });

  it("the Friend page shows our Net Balance", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    await asha.post("/api/friends", { email: "ben@example.com" });
    const [a, b] = [await personId(asha), await personId(ben)];
    await addExpense(asha, { description: "Cab", amount: "300", payerId: a, participants: [{ personId: a }, { personId: b }] });

    expect((await friendPage(asha, b)).netBalances).toEqual([{ currency: "INR", amount: 15000 }]);
    expect((await friendPage(ben, a)).netBalances).toEqual([{ currency: "INR", amount: -15000 }]);
  });
});
