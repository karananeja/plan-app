import { describe, expect, it } from "vitest";
import { activityFor, recordActivity } from "./activity/index.ts";
import { createTestApp, signedUp } from "./test/app.ts";

async function personIdOf(b: { get: (p: string) => Promise<Response> }) {
  const me = (await (await b.get("/api/me")).json()) as { person: { id: string } };
  return me.person.id;
}

describe("activity", () => {
  it("adding a Friend records FriendAdded for both people", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");
    const [ashaId, benId] = [await personIdOf(asha), await personIdOf(ben)];

    await asha.post("/api/friends", { email: "ben@example.com" });

    for (const id of [ashaId, benId]) {
      expect(activityFor(db, id)).toMatchObject([
        { type: "FriendAdded", actorId: ashaId, subject: { type: "person", id: benId } },
      ]);
    }
  });

  it("inviting an unknown email records PersonInvited and FriendAdded", async () => {
    const { app, db } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ashaId = await personIdOf(asha);

    await asha.post("/api/friends", { email: "zoe@example.com" });

    const types = activityFor(db, ashaId).map((a) => a.type);
    expect(types.sort()).toEqual(["FriendAdded", "PersonInvited"]);
  });

  it("an Activity is not kept when the change it describes fails", async () => {
    const { app, db } = createTestApp();
    const ashaId = await personIdOf(await signedUp(app, "Asha"));

    expect(() =>
      db.transaction((tx) => {
        recordActivity(tx, {
          type: "FriendAdded",
          actorId: ashaId,
          subject: { type: "person", id: ashaId },
          audience: [ashaId],
        });
        throw new Error("the change failed");
      }),
    ).toThrow("the change failed");

    expect(activityFor(db, ashaId)).toEqual([]);
  });
});
