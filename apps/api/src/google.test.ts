import { describe, expect, it } from "vitest";
import { browser, createTestApp, signedUp } from "./test/app.ts";
import { signInWithGoogle } from "./test/google.ts";

describe("Google sign-in", () => {
  it("is offered only when Google credentials are configured", async () => {
    const without = createTestApp();
    const withGoogle = createTestApp({ google: true });

    expect(await (await browser(without.app).get("/api/auth/options")).json()).toEqual({ google: false });
    expect(await (await browser(withGoogle.app).get("/api/auth/options")).json()).toEqual({ google: true });
  });

  it("a Google sign-in creates a User with a verified email, backed by an active Person", async () => {
    const { app } = createTestApp({ google: true });
    const b = browser(app);

    const callback = await signInWithGoogle(b, { email: "gita@gmail.com", name: "Gita Iyer" });
    expect(callback.status).toBe(302);

    expect(await (await b.get("/api/me")).json()).toMatchObject({
      name: "Gita Iyer",
      email: "gita@gmail.com",
      emailVerified: true,
      person: { status: "active" },
    });
  });

  it("Google sign-in with the email of a verified password account signs into that same User", async () => {
    const { app, email } = createTestApp({ google: true });
    const asha = await signedUp(app, "Asha");
    await asha.get(email.lastLink("asha@example.com", /verify/i));
    const passwordMe = (await (await asha.get("/api/me")).json()) as { person: { id: string } };

    const b = browser(app);
    const callback = await signInWithGoogle(b, { email: "asha@example.com", name: "Asha (Google)" });
    expect(callback.status).toBe(302);

    const googleMe = (await (await b.get("/api/me")).json()) as { person: { id: string }; email: string };
    expect(googleMe.email).toBe("asha@example.com");
    expect(googleMe.person.id).toBe(passwordMe.person.id);
  });

  it("won't link Google to a password account whose email isn't verified yet", async () => {
    const { app } = createTestApp({ google: true });
    await signedUp(app, "Asha");

    const b = browser(app);
    const callback = await signInWithGoogle(b, { email: "asha@example.com", name: "Asha (Google)" });

    expect(callback.headers.get("location")).toBe("/sign-in?error=account_not_linked");
    expect((await b.get("/api/me")).status).toBe(401);
  });
});
