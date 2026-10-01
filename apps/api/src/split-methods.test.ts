import { describe, expect, it } from "vitest";
import { createTestApp, signedUp } from "./test/app.ts";
import { addGroupExpense, getExpense, groupExpenses } from "./test/expenses.ts";
import { createGroup, getGroup, json } from "./test/groups.ts";

async function goaTrip() {
  const t = createTestApp();
  const asha = await signedUp(t.app, "Asha");
  const ben = await signedUp(t.app, "Ben");
  await signedUp(t.app, "Chen");
  await signedUp(t.app, "Divya");
  const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com", "chen@example.com", "divya@example.com"] });
  const [a, b, c, d] = (await getGroup(asha, id)).members.map((m) => m.personId) as [string, string, string, string];
  return { ...t, asha, ben, groupId: id, everyone: [a, b, c, d], ids: { a, b, c, d } };
}
const withValues = (ids: string[], values: string[]) => ids.map((personId, i) => ({ personId, value: values[i] }));
const sharesOf = (e: { shares: { shareMinor: number }[] }) => e.shares.map((s) => s.shareMinor);

describe("split methods", () => {
  it("Exact Amounts are used as typed, and the typed values are kept", async () => {
    const { asha, groupId, everyone, ids } = await goaTrip();

    const { id } = await json<{ id: string }>(
      addGroupExpense(asha, groupId, {
        description: "Itemised dinner", amount: "2000", payerId: ids.a, method: "exact",
        participants: withValues(everyone, ["700", "500", "500.00", "300"]),
      }),
    );

    const e = await getExpense(asha, id);
    expect(e.method).toBe("exact");
    expect(sharesOf(e)).toEqual([70000, 50000, 50000, 30000]);
    expect(e.shares.map((s) => s.input)).toEqual(["700.00", "500.00", "500.00", "300.00"]);
  });

  it("Percentages are read as typed (up to 2 decimals)", async () => {
    const { asha, groupId, everyone, ids } = await goaTrip();
    const body = (values: string[]) => ({ description: "Rent", amount: "2000", payerId: ids.a, method: "percentage", participants: withValues(everyone, values) });

    const { id } = await json<{ id: string }>(addGroupExpense(asha, groupId, body(["40", "20", "20", "20"])));
    expect(sharesOf(await getExpense(asha, id))).toEqual([80000, 40000, 40000, 40000]);

    const thirds = await json<{ id: string }>(addGroupExpense(asha, groupId, body(["33.33", "33.33", "33.34", "0"])));
    const e = await getExpense(asha, thirds.id);
    expect(sharesOf(e)).toEqual([66660, 66660, 66680, 0]);
    expect(e.shares.map((s) => s.input)).toEqual(["33.33", "33.33", "33.34", "0.00"]);

    expect((await addGroupExpense(asha, groupId, body(["33.333", "33.333", "33.334", "0"]))).status).toBe(400);
  });

  it("Share Units must be whole numbers", async () => {
    const { asha, groupId, everyone, ids } = await goaTrip();
    const body = (values: string[]) => ({ description: "Pizza", amount: "2000", payerId: ids.a, method: "shares", participants: withValues(everyone, values) });

    const { id } = await json<{ id: string }>(addGroupExpense(asha, groupId, body(["2", "1", "1", "1"])));
    expect(sharesOf(await getExpense(asha, id))).toEqual([80000, 40000, 40000, 40000]);

    expect((await addGroupExpense(asha, groupId, body(["2", "1.5", "1", "1"]))).status).toBe(400);
  });

  it("a Split that doesn't add up says how much is left (or too much)", async () => {
    const { asha, groupId, everyone, ids } = await goaTrip();

    const short = await addGroupExpense(asha, groupId, {
      description: "Itemised", amount: "2000", payerId: ids.a, method: "exact", participants: withValues(everyone, ["700", "500", "500", "100"]),
    });
    expect(short.status).toBe(400);
    expect(await short.json()).toMatchObject({ error: "₹200.00 left to assign", remaining: 20000 });

    const over = await addGroupExpense(asha, groupId, {
      description: "Rent", amount: "2000", payerId: ids.a, method: "percentage", participants: withValues(everyone, ["40", "21", "20", "20"]),
    });
    expect(over.status).toBe(400);
    expect(await over.json()).toMatchObject({ error: "1.00% too much", remaining: -100 });
  });

  it("the Payer can be someone else, and needn't be a Participant (a gift)", async () => {
    const { asha, ben, groupId, ids } = await goaTrip();

    await addGroupExpense(asha, groupId, { description: "Ben's round", amount: "800", payerId: ids.b, participantIds: [ids.a, ids.b] });
    await addGroupExpense(asha, groupId, { description: "Gift for Chen", amount: "1500", payerId: ids.a, participantIds: [ids.b, ids.d], date: "2026-09-27" });

    expect((await groupExpenses(asha, groupId)).map((e) => [e.description, e.myEffect])).toEqual([
      ["Ben's round", { kind: "owe", amountMinor: 40000 }],
      ["Gift for Chen", { kind: "lent", amountMinor: 150000 }],
    ]);
    expect((await groupExpenses(ben, groupId)).map((e) => e.myEffect)).toEqual([
      { kind: "lent", amountMinor: 40000 },
      { kind: "owe", amountMinor: 75000 },
    ]);
  });
});
