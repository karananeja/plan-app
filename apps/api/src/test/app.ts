import { createApp } from "../app.ts";
import type { Balances, CurrencyAmount } from "../balances/index.ts";
import type { Email, EmailSender } from "../email.ts";
import { createTestDb } from "./db.ts";

/** Records sent emails so tests can "click" the links in them. */
export class FakeEmailSender implements EmailSender {
  sent: Email[] = [];
  async send(email: Email) {
    this.sent.push(email);
  }
  /** The link in the most recent email to `to` whose subject matches. */
  lastLink(to: string, subject: RegExp): string {
    const email = this.sent.filter((e) => e.to === to && subject.test(e.subject)).at(-1);
    if (!email?.link) throw new Error(`No email to ${to} matching ${subject}`);
    return email.link;
  }
}

export const TEST_ORIGIN = "http://localhost:5173";
export const TEST_GOOGLE = { clientId: "test-client-id.apps.googleusercontent.com", clientSecret: "test-client-secret" };
export const TEST_AUTH = { secret: "test-secret-at-least-32-characters-long", origin: TEST_ORIGIN };

/** A fresh app on a fresh in-memory database, with a fake email sender. */
export function createTestApp(options: { google?: boolean; balances?: Balances } = {}) {
  const db = createTestDb();
  const email = new FakeEmailSender();
  const app = createApp({
    db,
    email,
    auth: options.google ? { ...TEST_AUTH, google: TEST_GOOGLE } : TEST_AUTH,
    balances: options.balances,
  });
  return { app, db, email };
}

type TestApp = ReturnType<typeof createTestApp>["app"];

/** A browser-like client: keeps the session cookie between requests. */
export function browser(app: TestApp) {
  const cookies = new Map<string, string>();
  async function request(method: string, path: string, body?: unknown, raw = false) {
    const url = path.startsWith("http") ? new URL(path) : new URL(path, TEST_ORIGIN);
    const res = await app.request(url.pathname + url.search, {
      method,
      headers: {
        origin: TEST_ORIGIN,
        cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : raw ? String(body) : JSON.stringify(body),
    });
    for (const header of res.headers.getSetCookie()) {
      const [pair = ""] = header.split(";");
      const [name = "", value = ""] = pair.split("=");
      if (/max-age=0/i.test(header) || value === "") cookies.delete(name);
      else cookies.set(name, value);
    }
    return res;
  }
  return {
    get: (path: string) => request("GET", path),
    post: (path: string, body: unknown = {}) => request("POST", path, body),
    patch: (path: string, body: unknown) => request("PATCH", path, body),
    delete: (path: string) => request("DELETE", path),
    /** POST a body exactly as given (e.g. malformed JSON). */
    postRaw: (path: string, body: string) => request("POST", path, body, true),
  };
}

/** Signs up a new User and returns their signed-in browser. */
export async function signedUp(app: TestApp, name: string) {
  const b = browser(app);
  const email = `${name.toLowerCase()}@example.com`;
  const res = await b.post("/api/auth/sign-up/email", { name, email, password: "a-good-password", currency: "INR" });
  if (res.status !== 200) throw new Error(`sign-up failed for ${email}: ${res.status}`);
  return Object.assign(b, { email, name });
}

/**
 * A Balances stand-in for guards that depend on money owed (Spec 03 supplies the real one).
 * Everyone is Settled Up until a test says otherwise.
 */
export class StubBalances implements Balances {
  private net = new Map<string, CurrencyAmount[]>();
  private group = new Map<string, CurrencyAmount[]>();
  netBalances(me: string, other: string) {
    return this.net.get(`${me}|${other}`) ?? this.net.get(`${other}|${me}`)?.map((b) => ({ ...b, amount: -b.amount })) ?? [];
  }
  groupBalances(groupId: string, personId: string) {
    return this.group.get(`${groupId}|${personId}`) ?? [];
  }
  setNet(me: string, other: string, amounts: CurrencyAmount[]) {
    this.net.set(`${me}|${other}`, amounts);
  }
  setGroup(groupId: string, personId: string, amounts: CurrencyAmount[]) {
    this.group.set(`${groupId}|${personId}`, amounts);
  }
}
