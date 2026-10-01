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
});
