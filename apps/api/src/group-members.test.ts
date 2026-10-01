import { describe, expect, it } from "vitest";
import { activityFor } from "./activity/index.ts";
import { group } from "./db/schema.ts";
import { eq } from "drizzle-orm";
import { createTestApp, signedUp } from "./test/app.ts";
import { createGroup, friendEmails, getGroup, personId } from "./test/groups.ts";

describe("adding Group members", () => {
  it("any member can add a Friend or a new email; they're friended with everyone", async () => {
    const { app, email } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const chen = await signedUp(app, "Chen");
    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com"] });
    await ben.post("/api/friends", { email: "chen@example.com" });

    const res = await ben.post(`/api/groups/${id}/members`, { emails: ["chen@example.com", "zoe@example.com"] });
    expect(res.status).toBe(200);

    expect((await getGroup(asha, id)).members.map((m) => m.email)).toEqual([
      "asha@example.com", "ben@example.com", "chen@example.com", "zoe@example.com",
    ]);
    expect(email.lastLink("zoe@example.com", /invited/i)).toContain("/sign-up");
    expect(await friendEmails(chen)).toEqual(["asha@example.com", "ben@example.com", "zoe@example.com"]);
  });

  it("records GroupMemberAdded for each new member, with the new member in the audience", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Goa Trip" });

    await asha.post(`/api/groups/${id}/members`, { emails: ["ben@example.com"] });

    const benId = await personId(ben);
    for (const who of [await personId(asha), benId]) {
      expect(activityFor(db, who).filter((a) => a.type === "GroupMemberAdded")).toMatchObject([
        { groupId: id, subject: { type: "person", id: benId } },
      ]);
    }
  });

  it("re-adding a member changes nothing; non-members can't add; archived Groups refuse", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const chen = await signedUp(app, "Chen");
    await signedUp(app, "Ben");
    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com"] });
    const before = activityFor(db, await personId(asha)).length;

    expect((await asha.post(`/api/groups/${id}/members`, { emails: ["ben@example.com"] })).status).toBe(200);
    expect((await getGroup(asha, id)).memberCount).toBe(2);
    expect(activityFor(db, await personId(asha))).toHaveLength(before);

    expect((await chen.post(`/api/groups/${id}/members`, { emails: ["chen@example.com"] })).status).toBe(404);

    db.update(group).set({ archivedAt: new Date() }).where(eq(group.id, id)).run();
    expect((await asha.post(`/api/groups/${id}/members`, { emails: ["chen@example.com"] })).status).toBe(400);
  });
});
