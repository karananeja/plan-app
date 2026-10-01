import { describe, expect, it } from "vitest";
import { activityFor } from "./activity/index.ts";
import { createTestApp, signedUp, StubBalances } from "./test/app.ts";
import { createGroup, getGroup, listGroups, personId } from "./test/groups.ts";

describe("editing, archiving and deleting a Group", () => {
  it("any member can edit name, emoji, colour and currency; each edit records what changed", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Goa", colour: "teal", memberEmails: ["ben@example.com"] });

    const res = await ben.patch(`/api/groups/${id}`, { name: "Goa Trip", emoji: "🏖️", colour: "blue", currency: "EUR" });
    expect(res.status).toBe(200);

    expect(await getGroup(asha, id)).toMatchObject({ name: "Goa Trip", emoji: "🏖️", colour: "blue", currency: "EUR" });
    const [latest] = activityFor(db, await personId(asha));
    expect(latest).toMatchObject({
      type: "GroupUpdated",
      actorId: await personId(ben),
      groupId: id,
      data: { changes: { name: { from: "Goa", to: "Goa Trip" }, colour: { from: "teal", to: "blue" }, currency: { from: "INR", to: "EUR" } } },
    });
  });

  it("archiving a Settled Up Group makes it read-only and marks it archived", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const { id } = await createGroup(asha, { name: "Goa Trip" });

    expect((await asha.post(`/api/groups/${id}/archive`)).status).toBe(200);

    expect(await listGroups(asha)).toMatchObject([{ id, archived: true }]);
    expect(activityFor(db, await personId(asha))[0]).toMatchObject({ type: "GroupArchived", groupId: id });
    expect((await asha.patch(`/api/groups/${id}`, { name: "Nope" })).status).toBe(400);
    expect((await asha.post(`/api/groups/${id}/members`, { emails: ["x@example.com"] })).status).toBe(400);
  });

  it("can't archive while any member has a non-zero Group Balance", async () => {
    const balances = new StubBalances();
    const { app } = createTestApp({ balances });
    const asha = await signedUp(app, "Asha");
    await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com"] });
    const benId = (await getGroup(asha, id)).members[1]!.personId;
    balances.setGroup(id, benId, [{ currency: "INR", amount: -50000 }]);

    const res = await asha.post(`/api/groups/${id}/archive`);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/settled up/i) });
    expect(await listGroups(asha)).toMatchObject([{ id, archived: false }]);
  });

  it("un-archiving makes the Group editable again", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const { id } = await createGroup(asha, { name: "Goa Trip" });
    await asha.post(`/api/groups/${id}/archive`);

    expect((await asha.post(`/api/groups/${id}/unarchive`)).status).toBe(200);

    expect(await listGroups(asha)).toMatchObject([{ id, archived: false }]);
    expect(activityFor(db, await personId(asha))[0]).toMatchObject({
      type: "GroupUpdated",
      data: { changes: { archived: { from: true, to: false } } },
    });
    expect((await asha.patch(`/api/groups/${id}`, { name: "Goa Trip 2026" })).status).toBe(200);
  });

  it("only the creator can delete; members are told, and the Group is gone for everyone", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Oops", memberEmails: ["ben@example.com"] });

    const byBen = await ben.delete(`/api/groups/${id}`);
    expect(byBen.status).toBe(400);
    expect((await getGroup(asha, id)).name).toBe("Oops");

    expect((await asha.delete(`/api/groups/${id}`)).status).toBe(200);

    for (const b of [asha, ben]) {
      expect((await b.get(`/api/groups/${id}`)).status).toBe(404);
      expect(await listGroups(b)).toEqual([]);
    }
    const benActivity = activityFor(db, await personId(ben));
    expect(benActivity[0]).toMatchObject({ type: "GroupDeleted", groupId: id, data: { name: "Oops" } });
    expect(benActivity.some((a) => a.type === "GroupCreated" && a.groupId === id)).toBe(true);
  });
});
