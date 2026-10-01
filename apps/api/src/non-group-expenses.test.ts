import { describe, expect, it } from "vitest";
import { activityFor } from "./activity/index.ts";
import { createTestApp, signedUp } from "./test/app.ts";
import { addExpense, friendPage, getExpense } from "./test/expenses.ts";
import { friendEmails, json, personId } from "./test/groups.ts";

/** Asha with Friends Ben and Chen (who aren't Friends with each other) and Divya. */
async function ashaAndFriends() {
  const t = createTestApp();
  const asha = await signedUp(t.app, "Asha");
  const ben = await signedUp(t.app, "Ben");
  const chen = await signedUp(t.app, "Chen");
  const divya = await signedUp(t.app, "Divya");
  for (const e of ["ben", "chen", "divya"]) await asha.post("/api/friends", { email: `${e}@example.com` });
  const ids = { asha: await personId(asha), ben: await personId(ben), chen: await personId(chen), divya: await personId(divya) };
  return { ...t, asha, ben, chen, divya, ids };
}

describe("non-group Expenses", () => {
  it("an Expense with a Friend shows on both Friend pages, in my currency, told only to those on it", async () => {
    const { db, asha, ben, ids } = await ashaAndFriends();

    const { id } = await json<{ id: string }>(
      addExpense(asha, { description: "Movie tickets", amount: "600", payerId: ids.asha, participants: [{ personId: ids.asha }, { personId: ids.ben }] }),
    );

    expect((await friendPage(asha, ids.ben)).expenses.map((e) => [e.description, e.currency, e.myEffect])).toEqual([
      ["Movie tickets", "INR", { kind: "lent", amountMinor: 30000 }],
    ]);
    expect((await friendPage(ben, ids.asha)).expenses.map((e) => e.myEffect)).toEqual([{ kind: "owe", amountMinor: 30000 }]);
    expect(await getExpense(ben, id)).toMatchObject({ groupId: null, totalMinor: 60000 });

    expect(activityFor(db, ids.asha)[0]).toMatchObject({ type: "ExpenseCreated", subject: { type: "expense", id }, groupId: null });
    expect(activityFor(db, ids.ben)[0]).toMatchObject({ type: "ExpenseCreated", subject: { id } });
    expect(activityFor(db, ids.divya).some((a) => a.type === "ExpenseCreated")).toBe(false);
  });

  it("a new email on an Expense becomes an Invited Person who's emailed an invite", async () => {
    const { asha, email, ids } = await ashaAndFriends();

    const { id } = await json<{ id: string }>(
      addExpense(asha, { description: "Cab", amount: "450", payerId: ids.asha, participants: [{ personId: ids.asha }, { email: "Zoe@Example.com" }] }),
    );

    expect((await getExpense(asha, id)).shares.map((s) => [s.name, s.shareMinor])).toEqual([["Asha", 22500], ["zoe@example.com", 22500]]);
    expect(email.lastLink("zoe@example.com", /invited/i)).toContain("/sign-up?email=zoe");
  });

  it("everyone on the Expense becomes Friends; FriendAdded only for new Friendships", async () => {
    const { db, asha, ben, chen, ids } = await ashaAndFriends();
    expect(await friendEmails(ben)).toEqual(["asha@example.com"]);

    await addExpense(asha, {
      description: "Groceries", amount: "900", payerId: ids.ben,
      participants: [{ personId: ids.asha }, { personId: ids.ben }, { personId: ids.chen }],
    });

    expect(await friendEmails(ben)).toEqual(["asha@example.com", "chen@example.com"]);
    expect(await friendEmails(chen)).toEqual(["asha@example.com", "ben@example.com"]);
    const friendAdded = activityFor(db, ids.ben).filter((a) => a.type === "FriendAdded");
    expect(friendAdded).toHaveLength(2); // Asha↔Ben when Asha added him earlier, Ben↔Chen now
  });

  it("is invisible to people who aren't on it, even Friends of those who are", async () => {
    const { asha, divya, ids } = await ashaAndFriends();
    const { id } = await json<{ id: string }>(
      addExpense(asha, { description: "Movie", amount: "600", payerId: ids.asha, participants: [{ personId: ids.asha }, { personId: ids.ben }] }),
    );

    expect((await divya.get(`/api/expenses/${id}`)).status).toBe(404);
    expect((await friendPage(divya, ids.asha)).expenses).toEqual([]);
  });

  it("only me and my Friends; I must be on it; any split method; a known currency", async () => {
    const { app, asha, ids } = await ashaAndFriends();
    const stranger = await personId(await signedUp(app, "Zed"));
    const both = [{ personId: ids.asha }, { personId: ids.ben }];

    const notFriend = await addExpense(asha, { description: "x", amount: "10", payerId: ids.asha, participants: [{ personId: ids.asha }, { personId: stranger }] });
    expect(notFriend.status).toBe(400);
    const notMe = await addExpense(asha, { description: "x", amount: "10", payerId: ids.ben, participants: [{ personId: ids.ben }, { personId: ids.chen }] });
    expect(notMe.status).toBe(400);
    expect(await notMe.json()).toMatchObject({ error: expect.stringMatching(/you/i) });
    expect((await addExpense(asha, { description: "x", amount: "10", currency: "XYZ", payerId: ids.asha, participants: both })).status).toBe(400);

    const exact = await json<{ id: string }>(
      addExpense(asha, {
        description: "Lunch", amount: "25", currency: "EUR", payerId: ids.ben, method: "exact",
        participants: [{ personId: ids.asha, value: "15" }, { personId: ids.ben, value: "10" }],
      }),
    );
    expect(await getExpense(asha, exact.id)).toMatchObject({ currency: "EUR", myEffect: { kind: "owe", amountMinor: 1500 } });
  });
});
