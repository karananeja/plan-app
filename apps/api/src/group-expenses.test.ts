import { describe, expect, it } from "vitest";
import { activityFor } from "./activity/index.ts";
import { browser, createTestApp, signedUp } from "./test/app.ts";
import { addGroupExpense, getExpense, groupExpenses } from "./test/expenses.ts";
import { createGroup, getGroup, json, listGroups } from "./test/groups.ts";

/** Asha's "Goa Trip" with Ben, Chen and Divya. */
async function goaTrip() {
  const t = createTestApp();
  const asha = await signedUp(t.app, "Asha");
  const ben = await signedUp(t.app, "Ben");
  const chen = await signedUp(t.app, "Chen");
  const divya = await signedUp(t.app, "Divya");
  const { id } = await createGroup(asha, {
    name: "Goa Trip",
    memberEmails: ["ben@example.com", "chen@example.com", "divya@example.com"],
  });
  const byName = new Map((await getGroup(asha, id)).members.map((m) => [m.name, m.personId]));
  const ids = { Asha: byName.get("Asha")!, Ben: byName.get("Ben")!, Chen: byName.get("Chen")!, Divya: byName.get("Divya")! };
  return { ...t, asha, ben, chen, divya, groupId: id, ids };
}

describe("Group Expenses", () => {
  it("records an equal split and shows each viewer what it means for them", async () => {
    const { asha, ben, divya, groupId, ids } = await goaTrip();

    const created = await json<{ id: string }>(
      addGroupExpense(asha, groupId, {
        description: "Dinner at Fisherman's Wharf",
        amount: "1200",
        payerId: ids.Asha,
        participantIds: [ids.Asha, ids.Ben, ids.Chen, ids.Divya],
      }),
    );
    await addGroupExpense(asha, groupId, {
      description: "Snacks",
      amount: "100",
      date: "2026-09-27",
      payerId: ids.Ben,
      participantIds: [ids.Ben, ids.Chen],
    });

    expect((await groupExpenses(asha, groupId)).map((e) => [e.description, e.myEffect])).toEqual([
      ["Dinner at Fisherman's Wharf", { kind: "lent", amountMinor: 90000 }],
      ["Snacks", { kind: "none", amountMinor: 0 }],
    ]);
    expect((await groupExpenses(ben, groupId))[0]!.myEffect).toEqual({ kind: "owe", amountMinor: 30000 });
    expect((await groupExpenses(divya, groupId))[1]!.myEffect).toEqual({ kind: "none", amountMinor: 0 });

    const detail = await getExpense(ben, created.id);
    expect(detail).toMatchObject({
      description: "Dinner at Fisherman's Wharf",
      currency: "INR",
      totalMinor: 120000,
      method: "equal",
      groupId,
      payer: { personId: ids.Asha, name: "Asha" },
    });
    expect(detail.shares.map((s) => [s.name, s.shareMinor])).toEqual([
      ["Asha", 30000], ["Ben", 30000], ["Chen", 30000], ["Divya", 30000],
    ]);
  });

  it("records ExpenseCreated for every Group Member, involved or not", async () => {
    const { db, asha, groupId, ids } = await goaTrip();

    const { id } = await json<{ id: string }>(
      addGroupExpense(asha, groupId, { description: "Taxi", amount: "600", payerId: ids.Asha, participantIds: [ids.Asha, ids.Ben] }),
    );

    for (const who of Object.values(ids)) {
      expect(activityFor(db, who)[0]).toMatchObject({
        type: "ExpenseCreated",
        actorId: ids.Asha,
        subject: { type: "expense", id },
        groupId,
        data: { description: "Taxi", totalMinor: 60000, currency: "INR" },
      });
    }
  });

  it("only Group Members take part or see it; bad amounts and empty splits are refused with a reason", async () => {
    const { app, asha, groupId, ids } = await goaTrip();
    const outsider = await signedUp(app, "Zed");
    const zedId = (await json<{ person: { id: string } }>(outsider.get("/api/me"))).person.id;
    const valid = { description: "Taxi", amount: "600", payerId: ids.Asha, participantIds: [ids.Asha, ids.Ben] };
    const { id } = await json<{ id: string }>(addGroupExpense(asha, groupId, valid));

    expect((await addGroupExpense(asha, groupId, { ...valid, payerId: zedId })).status).toBe(400);
    expect((await addGroupExpense(asha, groupId, { ...valid, participantIds: [ids.Asha, zedId] })).status).toBe(400);

    expect((await addGroupExpense(outsider, groupId, valid)).status).toBe(404);
    expect((await outsider.get(`/api/groups/${groupId}/expenses`)).status).toBe(404);
    expect((await outsider.get(`/api/expenses/${id}`)).status).toBe(404);

    const tooPrecise = await addGroupExpense(asha, groupId, { ...valid, amount: "12.345" });
    expect(tooPrecise.status).toBe(400);
    expect(await tooPrecise.json()).toMatchObject({ error: expect.stringMatching(/decimal/i) });
    const nobody = await addGroupExpense(asha, groupId, { ...valid, participantIds: [] });
    expect(nobody.status).toBe(400);
    expect(await nobody.json()).toMatchObject({ error: expect.stringMatching(/at least one person/i) });
  });

  describe("Group rules once Expenses exist (from Spec 01)", () => {
    it("adding an Expense to an archived Group un-archives it", async () => {
      const { db, asha, groupId, ids } = await goaTrip();
      await asha.post(`/api/groups/${groupId}/archive`);

      expect((await addGroupExpense(asha, groupId, { description: "One more", amount: "50", payerId: ids.Asha, participantIds: [ids.Asha] })).status).toBe(200);

      expect((await listGroups(asha))[0]).toMatchObject({ id: groupId, archived: false });
      const groupEvents = activityFor(db, ids.Asha).filter((a) => a.groupId === groupId).map((a) => a.type);
      expect(groupEvents.slice(0, 2).sort()).toEqual(["ExpenseCreated", "GroupUpdated"]);
    });

    it("a Group's currency is locked, and it can't be deleted, once it has an Expense", async () => {
      const { asha, groupId, ids } = await goaTrip();
      expect((await asha.patch(`/api/groups/${groupId}`, { currency: "EUR" })).status).toBe(200);
      await addGroupExpense(asha, groupId, { description: "Taxi", amount: "6", payerId: ids.Asha, participantIds: [ids.Asha] });

      const currency = await asha.patch(`/api/groups/${groupId}`, { currency: "INR" });
      expect(currency.status).toBe(400);
      expect(await currency.json()).toMatchObject({ error: expect.stringMatching(/currency/i) });
      expect((await asha.patch(`/api/groups/${groupId}`, { name: "Renamed is fine" })).status).toBe(200);

      const del = await asha.delete(`/api/groups/${groupId}`);
      expect(del.status).toBe(400);
      expect(await del.json()).toMatchObject({ error: expect.stringMatching(/expenses/i) });
    });
  });

  it("an invited Participant still has their Expense after claiming the invite (from Spec 01)", async () => {
    const { app, email } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const { id: groupId } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["zoe@example.com"] });
    const members = (await getGroup(asha, groupId)).members;
    const [ashaId, zoeId] = [members[0]!.personId, members[1]!.personId];
    await addGroupExpense(asha, groupId, { description: "Hotel", amount: "4000", payerId: ashaId, participantIds: [ashaId, zoeId] });

    const zoe = browser(app);
    await zoe.post("/api/auth/sign-up/email", { name: "Zoe", email: "zoe@example.com", password: "zoe-password-1" });
    await zoe.get(email.lastLink("zoe@example.com", /verify/i));

    expect((await groupExpenses(zoe, groupId)).map((e) => [e.description, e.myEffect])).toEqual([
      ["Hotel", { kind: "owe", amountMinor: 200000 }],
    ]);
  });
});
