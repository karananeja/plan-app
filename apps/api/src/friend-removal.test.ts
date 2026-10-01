import { describe, expect, it } from "vitest";
import { activityFor } from "./activity/index.ts";
import { createTestApp, signedUp, StubBalances } from "./test/app.ts";
import { createGroup, friendEmails, personId } from "./test/groups.ts";

describe("removing a Friend", () => {
  it("removes the Friendship for both when Settled Up with no shared Group; re-adding works", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    await asha.post("/api/friends", { email: "ben@example.com" });
    const benId = await personId(ben);

    expect((await asha.delete(`/api/friends/${benId}`)).status).toBe(200);

    expect(await friendEmails(asha)).toEqual([]);
    expect(await friendEmails(ben)).toEqual([]);
    for (const who of [await personId(asha), benId]) {
      expect(activityFor(db, who)[0]).toMatchObject({ type: "FriendRemoved", subject: { type: "person", id: benId } });
    }

    await asha.post("/api/friends", { email: "ben@example.com" });
    expect(await friendEmails(ben)).toEqual(["asha@example.com"]);
  });

  it("is blocked while you share a non-archived Group (named), but not by archived ones", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const benId = await personId(ben);
    const { id } = await createGroup(asha, { name: "Goa Trip", memberEmails: ["ben@example.com"] });

    const blocked = await asha.delete(`/api/friends/${benId}`);
    expect(blocked.status).toBe(400);
    expect(await blocked.json()).toMatchObject({ error: expect.stringContaining("Goa Trip") });
    expect(await friendEmails(asha)).toEqual(["ben@example.com"]);

    await asha.post(`/api/groups/${id}/archive`);
    expect((await asha.delete(`/api/friends/${benId}`)).status).toBe(200);
  });

  it("is blocked while the Net Balance isn't zero", async () => {
    const balances = new StubBalances();
    const { app } = createTestApp({ balances });
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    await asha.post("/api/friends", { email: "ben@example.com" });
    const benId = await personId(ben);
    balances.setNet(await personId(asha), benId, [{ currency: "INR", amount: 2500 }]);

    const res = await asha.delete(`/api/friends/${benId}`);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/settled up/i) });
    expect(await friendEmails(asha)).toEqual(["ben@example.com"]);
  });
});
