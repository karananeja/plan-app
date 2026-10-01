import { describe, expect, it } from "vitest";
import { createTestApp, signedUp } from "./test/app.ts";

type Friend = { personId: string; name: string; email: string; invited: boolean; netBalances: { currency: string; amount: number }[] };

async function friendsOf(b: { get: (p: string) => Promise<Response> }, q?: string): Promise<Friend[]> {
  const res = await b.get(q ? `/api/friends?q=${encodeURIComponent(q)}` : "/api/friends");
  expect(res.status).toBe(200);
  return ((await res.json()) as { friends: Friend[] }).friends;
}

describe("friends", () => {
  it("adding an existing User's email makes a mutual Friendship", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");

    const res = await asha.post("/api/friends", { email: "BEN@example.com " });
    expect(res.status).toBe(200);

    expect(await friendsOf(asha)).toMatchObject([{ name: "Ben", email: "ben@example.com", invited: false }]);
    expect(await friendsOf(ben)).toMatchObject([{ name: "Asha", email: "asha@example.com", invited: false }]);
  });

  it("adding an unknown email creates an Invited Person and emails them a join link", async () => {
    const { app, email } = createTestApp();
    const asha = await signedUp(app, "Asha");

    await asha.post("/api/friends", { email: "zoe@example.com" });

    expect(await friendsOf(asha)).toMatchObject([{ name: "zoe@example.com", email: "zoe@example.com", invited: true }]);
    const link = new URL(email.lastLink("zoe@example.com", /invited/i));
    expect(link.pathname).toBe("/sign-up");
    expect(link.searchParams.get("email")).toBe("zoe@example.com");
  });

  it("the same email added by two Users is one Person; adding a Friend twice changes nothing", async () => {
    const { app, email } = createTestApp();
    const asha = await signedUp(app, "Asha");
    const ben = await signedUp(app, "Ben");

    await asha.post("/api/friends", { email: "zoe@example.com" });
    await ben.post("/api/friends", { email: "Zoe@Example.com" });
    await ben.post("/api/friends", { email: "zoe@example.com" });

    const [zoeForAsha] = await friendsOf(asha);
    const benFriends = await friendsOf(ben);
    expect(benFriends).toHaveLength(1);
    expect(benFriends[0]?.personId).toBe(zoeForAsha?.personId);
    expect(email.sent.filter((e) => e.to === "zoe@example.com")).toHaveLength(1);
  });

  it("you can't add yourself as a Friend", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");

    const res = await asha.post("/api/friends", { email: "Asha@example.com" });

    expect(res.status).toBe(400);
    expect(await friendsOf(asha)).toEqual([]);
  });

  it("lists Friends with their Net Balance and filters by name or email", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");
    await signedUp(app, "Ben");
    await asha.post("/api/friends", { email: "ben@example.com" });
    await asha.post("/api/friends", { email: "zoe@elsewhere.org" });

    expect(await friendsOf(asha)).toMatchObject([
      { name: "Ben", netBalances: [] },
      { email: "zoe@elsewhere.org", netBalances: [] },
    ]);
    expect(await friendsOf(asha, "be")).toMatchObject([{ name: "Ben" }]);
    expect(await friendsOf(asha, "ELSEWHERE")).toMatchObject([{ email: "zoe@elsewhere.org" }]);
  });
});
