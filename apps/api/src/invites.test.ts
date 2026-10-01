import { describe, expect, it } from "vitest";
import { activityFor } from "./activity/index.ts";
import { browser, createTestApp, signedUp } from "./test/app.ts";
import { signInWithGoogle } from "./test/google.ts";

type Me = { name: string; email: string; inviteWaiting: boolean; person: { id: string; status: string } | null };
const me = async (b: { get: (p: string) => Promise<Response> }) => (await (await b.get("/api/me")).json()) as Me;
const zoe = { name: "Zoe Park", email: "zoe@example.com", password: "zoe-password-1" };

/** Asha signs up and invites zoe@example.com; returns Asha's browser and Zoe's invited Person id. */
async function ashaInvitesZoe(app: Parameters<typeof signedUp>[0]) {
  const asha = await signedUp(app, "Asha");
  await asha.post("/api/friends", { email: zoe.email });
  const res = (await (await asha.get("/api/friends")).json()) as { friends: { personId: string; email: string }[] };
  const invitedId = res.friends.find((f) => f.email === zoe.email)!.personId;
  return { asha, invitedId };
}

describe("claiming an invite", () => {
  it("an invited email can sign up, but waits for verification before claiming", async () => {
    const { app } = createTestApp();
    await ashaInvitesZoe(app);

    const b = browser(app);
    const signUp = await b.post("/api/auth/sign-up/email", zoe);
    expect(signUp.status).toBe(200);

    expect(await me(b)).toMatchObject({ email: zoe.email, person: null, inviteWaiting: true });
    const friends = await b.get("/api/friends");
    expect(friends.status).toBe(403);
  });

  it("verifying the email claims the invited Person, keeping its Friendships", async () => {
    const { app, email } = createTestApp();
    const { asha, invitedId } = await ashaInvitesZoe(app);
    const b = browser(app);
    await b.post("/api/auth/sign-up/email", zoe);

    await b.get(email.lastLink(zoe.email, /verify/i));

    expect(await me(b)).toMatchObject({ name: "Zoe Park", inviteWaiting: false, person: { id: invitedId, status: "active" } });
    const ashaFriends = (await (await asha.get("/api/friends")).json()) as { friends: unknown[] };
    expect(ashaFriends.friends).toMatchObject([{ personId: invitedId, name: "Zoe Park", invited: false }]);
    expect((await b.get("/api/friends")).status).toBe(200);
  });

  it("claiming records InviteClaimed for the claimed Person and their Friends", async () => {
    const { app, db, email } = createTestApp();
    const { asha, invitedId } = await ashaInvitesZoe(app);
    const ashaId = (await me(asha)).person!.id;
    const b = browser(app);
    await b.post("/api/auth/sign-up/email", zoe);

    await b.get(email.lastLink(zoe.email, /verify/i));

    for (const id of [ashaId, invitedId]) {
      expect(activityFor(db, id)[0]).toMatchObject({
        type: "InviteClaimed",
        actorId: invitedId,
        subject: { type: "person", id: invitedId },
      });
    }
  });

  it("a Google sign-up with an invited email claims the invite straight away", async () => {
    const { app } = createTestApp({ google: true });
    const { invitedId } = await ashaInvitesZoe(app);
    const b = browser(app);

    await signInWithGoogle(b, { email: zoe.email, name: "Zoe Park" });

    expect(await me(b)).toMatchObject({ inviteWaiting: false, person: { id: invitedId, status: "active" } });
  });

  it("a sign-up nobody invited gets an active Person straight away, verified or not", async () => {
    const { app } = createTestApp();
    await ashaInvitesZoe(app);
    const b = browser(app);

    await b.post("/api/auth/sign-up/email", { ...zoe, email: "yuki@example.com" });

    expect(await me(b)).toMatchObject({ emailVerified: false, inviteWaiting: false, person: { status: "active" } });
    expect((await b.get("/api/friends")).status).toBe(200);
  });
});
