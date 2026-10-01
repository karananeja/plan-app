import { describe, expect, it } from "vitest";
import { browser, createTestApp } from "./test/app.ts";

const asha = { name: "Asha Rao", email: "asha@example.com", password: "correct-horse-battery", currency: "INR" };

describe("accounts", () => {
  it("sign-up creates a User backed by an active Person, not yet verified", async () => {
    const { app } = createTestApp();
    const b = browser(app);

    const signUp = await b.post("/api/auth/sign-up/email", asha);
    expect(signUp.status).toBe(200);

    const me = await b.get("/api/me");
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      name: "Asha Rao",
      email: "asha@example.com",
      currency: "INR",
      emailVerified: false,
      person: { status: "active" },
    });
  });

  it("sign-up emails a verification link that marks the email verified", async () => {
    const { app, email } = createTestApp();
    const b = browser(app);
    await b.post("/api/auth/sign-up/email", asha);

    const link = email.lastLink(asha.email, /verify/i);
    await b.get(link);

    expect(await (await b.get("/api/me")).json()).toMatchObject({ emailVerified: true });
  });

  it("signing out ends the session; anonymous requests get 401", async () => {
    const { app } = createTestApp();
    const b = browser(app);
    await b.post("/api/auth/sign-up/email", asha);

    await b.post("/api/auth/sign-out");

    expect((await b.get("/api/me")).status).toBe(401);
    expect((await browser(app).get("/api/me")).status).toBe(401);
  });

  it("signs in with the right password and rejects a wrong one", async () => {
    const { app } = createTestApp();
    await browser(app).post("/api/auth/sign-up/email", asha);

    const wrong = browser(app);
    const rejected = await wrong.post("/api/auth/sign-in/email", { email: asha.email, password: "nope-nope-nope" });
    expect(rejected.status).toBe(401);
    expect((await wrong.get("/api/me")).status).toBe(401);

    const right = browser(app);
    await right.post("/api/auth/sign-in/email", { email: asha.email, password: asha.password });
    expect(await (await right.get("/api/me")).json()).toMatchObject({ email: asha.email });
  });

  it("resets a forgotten password through an emailed link", async () => {
    const { app, email } = createTestApp();
    await browser(app).post("/api/auth/sign-up/email", asha);

    const b = browser(app);
    await b.post("/api/auth/request-password-reset", { email: asha.email, redirectTo: "/reset-password" });
    const link = new URL(email.lastLink(asha.email, /reset/i));
    const token = link.pathname.split("/").at(-1);
    const reset = await b.post("/api/auth/reset-password", { token, newPassword: "a-brand-new-password" });
    expect(reset.status).toBe(200);

    const old = await browser(app).post("/api/auth/sign-in/email", { email: asha.email, password: asha.password });
    expect(old.status).toBe(401);
    const fresh = await browser(app).post("/api/auth/sign-in/email", { email: asha.email, password: "a-brand-new-password" });
    expect(fresh.status).toBe(200);
  });

  it("updates name and profile currency, and rejects an unknown currency", async () => {
    const { app } = createTestApp();
    const b = browser(app);
    await b.post("/api/auth/sign-up/email", asha);

    const ok = await b.patch("/api/me", { name: "Asha R.", currency: "EUR" });
    expect(ok.status).toBe(200);
    expect(await (await b.get("/api/me")).json()).toMatchObject({ name: "Asha R.", currency: "EUR" });

    const bad = await b.patch("/api/me", { currency: "XYZ1" });
    expect(bad.status).toBe(400);
    expect(await (await b.get("/api/me")).json()).toMatchObject({ currency: "EUR" });
  });
});
