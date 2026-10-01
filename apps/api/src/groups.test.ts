import { afterEach, describe, expect, it, vi } from "vitest";
import { activityFor, recordActivity } from "./activity/index.ts";
import { createTestApp, signedUp } from "./test/app.ts";
import { createGroup, getGroup, json, listGroups, personId, type Browser } from "./test/groups.ts";

describe("groups", () => {
  afterEach(() => vi.useRealTimers());

  it("creates a Group in the creator's currency, with the creator as a member", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");

    const { id } = await createGroup(asha, { name: "Goa Trip", type: "trip", emoji: "🏖️", colour: "teal", memberEmails: [] });

    expect(await listGroups(asha)).toMatchObject([
      { id, name: "Goa Trip", type: "trip", emoji: "🏖️", colour: "teal", currency: "INR", memberCount: 1 },
    ]);
    expect(await getGroup(asha, id)).toMatchObject({
      name: "Goa Trip",
      members: [{ name: "Asha", email: "asha@example.com", invited: false, groupBalances: [] }],
    });
  });

  it("adds initial members by email and makes every member Friends with every other", async () => {
    const { app, email } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const chen = await signedUp(app, "Chen");
    await asha.post("/api/friends", { email: "ben@example.com" });

    const { id } = await createGroup(asha, {
      name: "Flat 4B",
      type: "home",
      memberEmails: ["ben@example.com", "Chen@example.com", "zoe@example.com"],
    });

    const group = await getGroup(asha, id);
    expect(group.members.map((m) => [m.email, m.invited])).toEqual([
      ["asha@example.com", false],
      ["ben@example.com", false],
      ["chen@example.com", false],
      ["zoe@example.com", true],
    ]);
    expect(email.lastLink("zoe@example.com", /invited/i)).toContain("/sign-up?email=zoe");

    const friendEmails = async (b: Browser) =>
      (await json<{ friends: { email: string }[] }>(b.get("/api/friends"))).friends.map((f) => f.email).sort();
    expect(await friendEmails(ben)).toEqual(["asha@example.com", "chen@example.com", "zoe@example.com"]);
    expect(await friendEmails(chen)).toEqual(["asha@example.com", "ben@example.com", "zoe@example.com"]);
  });

  it("a Group is invisible to people who aren't members", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Asha only" });

    expect((await ben.get(`/api/groups/${id}`)).status).toBe(404);
    expect(await listGroups(ben)).toEqual([]);
    expect((await ben.get("/api/groups/no-such-group")).status).toBe(404);
  });

  it("rejects an empty name, an unknown currency or an unknown colour", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");

    for (const bad of [{ name: "  " }, { name: "Trip", currency: "XYZ" }, { name: "Trip", colour: "hotpink" }]) {
      expect((await asha.post("/api/groups", bad)).status, JSON.stringify(bad)).toBe(400);
    }
    expect(await listGroups(asha)).toEqual([]);
  });

  it("records GroupCreated and GroupMemberAdded for all members, and FriendAdded only for new Friendships", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    await signedUp(app, "Ben");
    await asha.post("/api/friends", { email: "ben@example.com" });

    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com", "chen@example.com"] });
    const [ashaM, benM, chenM] = (await getGroup(asha, id)).members;

    const groupEvents = (personId: string) =>
      activityFor(db, personId)
        .filter((a) => a.groupId === id)
        .map((a) => [a.type, a.subject.id])
        .sort();
    for (const m of [ashaM!, benM!, chenM!]) {
      expect(groupEvents(m.personId)).toEqual(
        [["GroupCreated", id], ["GroupMemberAdded", benM!.personId], ["GroupMemberAdded", chenM!.personId]].sort(),
      );
    }
    const benFriendAdded = activityFor(db, benM!.personId).filter((a) => a.type === "FriendAdded");
    expect(benFriendAdded.map((a) => a.subject.id).sort()).toEqual([benM!.personId, chenM!.personId].sort());
  });

  it("lists Groups by their latest Activity, newest first", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ashaId = await personId(asha);

    vi.setSystemTime(new Date("2026-10-01T10:00:00Z"));
    const older = await createGroup(asha, { name: "Older" });
    vi.setSystemTime(new Date("2026-10-01T11:00:00Z"));
    await createGroup(asha, { name: "Newer" });
    expect((await listGroups(asha)).map((g) => g.name)).toEqual(["Newer", "Older"]);

    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    db.transaction((tx) =>
      recordActivity(tx, { type: "GroupCreated", actorId: ashaId, subject: { type: "group", id: older.id }, groupId: older.id, audience: [ashaId] }),
    );
    expect((await listGroups(asha)).map((g) => g.name)).toEqual(["Older", "Newer"]);
  });
});

