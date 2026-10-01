import { describe, expect, it } from "vitest";
import { activityFor } from "./activity/index.ts";
import { createTestApp, signedUp, StubBalances } from "./test/app.ts";
import { createGroup, friendEmails, getGroup, listGroups, personId } from "./test/groups.ts";

describe("leaving a Group and removing members", () => {
  it("a Settled Up member can leave; the Group disappears for them but Friendships stay", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com"] });

    expect((await ben.post(`/api/groups/${id}/leave`)).status).toBe(200);

    expect((await ben.get(`/api/groups/${id}`)).status).toBe(404);
    expect(await listGroups(ben)).toEqual([]);
    expect((await getGroup(asha, id)).members.map((m) => m.email)).toEqual(["asha@example.com"]);
    expect(await friendEmails(ben)).toEqual(["asha@example.com"]);
    const benId = await personId(ben);
    for (const who of [await personId(asha), benId]) {
      expect(activityFor(db, who)[0]).toMatchObject({ type: "GroupMemberLeft", actorId: benId, groupId: id });
    }
  });

  it("any member can remove another Settled Up member; the removed person is told and loses access", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    await signedUp(app, "Chen");
    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com", "chen@example.com"] });
    const chenId = (await getGroup(asha, id)).members[2]!.personId;

    expect((await ben.delete(`/api/groups/${id}/members/${chenId}`)).status).toBe(200);

    expect((await getGroup(asha, id)).members.map((m) => m.email)).toEqual(["asha@example.com", "ben@example.com"]);
    expect(activityFor(db, chenId)[0]).toMatchObject({
      type: "GroupMemberRemoved",
      actorId: await personId(ben),
      subject: { type: "person", id: chenId },
      groupId: id,
    });
  });

  it("blocks leaving or removal while that person's Group Balance isn't zero", async () => {
    const balances = new StubBalances();
    const { app } = createTestApp({ balances });
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com"] });
    const benId = await personId(ben);
    balances.setGroup(id, benId, [{ currency: "INR", amount: -125000 }]);

    const leave = await ben.post(`/api/groups/${id}/leave`);
    expect(leave.status).toBe(400);
    expect(await leave.json()).toMatchObject({ error: expect.stringMatching(/settle/i) });
    expect((await asha.delete(`/api/groups/${id}/members/${benId}`)).status).toBe(400);
    expect((await getGroup(asha, id)).memberCount).toBe(2);
  });

  it("the last member can't leave; they archive or delete the Group instead", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const { id } = await createGroup(asha, { name: "Solo" });

    const res = await asha.post(`/api/groups/${id}/leave`);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/archive or delete/i) });
    expect(await listGroups(asha)).toHaveLength(1);
  });
});
