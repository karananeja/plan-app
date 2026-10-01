import { describe, expect, it } from "vitest";
import { seed } from "./seed.ts";
import { browser, createTestApp, TEST_AUTH } from "./test/app.ts";

// The documented demo logins (see README).
const DEMO_EMAILS = ["asha@example.com", "ben@example.com", "chen@example.com", "divya@example.com"];
const DEMO_PASSWORD = "demo-password";

describe("seed", () => {
  it("creates verified demo Users who can sign in, and is safe to re-run", async () => {
    const { app, db } = createTestApp();

    await seed(db, TEST_AUTH);
    await seed(db, TEST_AUTH);

    for (const email of DEMO_EMAILS) {
      const b = browser(app);
      const signIn = await b.post("/api/auth/sign-in/email", { email, password: DEMO_PASSWORD });
      expect(signIn.status, email).toBe(200);
      expect(await (await b.get("/api/me")).json()).toMatchObject({
        email,
        emailVerified: true,
        person: { status: "active" },
      });
    }
  });

  it("gives the demo Users shared Groups, without duplicating them on re-run", async () => {
    const { app, db } = createTestApp();
    await seed(db, TEST_AUTH);
    await seed(db, TEST_AUTH);

    const b = browser(app);
    await b.post("/api/auth/sign-in/email", { email: "asha@example.com", password: DEMO_PASSWORD });
    const { groups } = (await (await b.get("/api/groups")).json()) as { groups: { name: string; memberCount: number }[] };

    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(new Set(groups.map((g) => g.name)).size).toBe(groups.length);
    expect(groups.every((g) => g.memberCount >= 2)).toBe(true);
  });

  it("adds a few Expenses to the demo Groups, without duplicating them on re-run", async () => {
    const { app, db } = createTestApp();
    await seed(db, TEST_AUTH);
    await seed(db, TEST_AUTH);

    const b = browser(app);
    await b.post("/api/auth/sign-in/email", { email: "ben@example.com", password: DEMO_PASSWORD });
    const { groups } = (await (await b.get("/api/groups")).json()) as { groups: { id: string; name: string }[] };
    const goa = groups.find((g) => g.name === "Goa Trip")!;
    const { expenses } = (await (await b.get(`/api/groups/${goa.id}/expenses`)).json()) as { expenses: { description: string }[] };

    expect(expenses.length).toBeGreaterThanOrEqual(2);
    expect(new Set(expenses.map((e) => e.description)).size).toBe(expenses.length);
  });
});
