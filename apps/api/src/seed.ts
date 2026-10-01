import { eq } from "drizzle-orm";
import { createAuth, type AuthConfig } from "./auth.ts";
import type { Db } from "./db/client.ts";
import { user } from "./db/schema.ts";
import type { EmailSender } from "./email.ts";

/** Demo logins for trying the app as several people. Documented in the README. */
const DEMO_USERS = [
  { name: "Asha Rao", email: "asha@example.com" },
  { name: "Ben Thomas", email: "ben@example.com" },
  { name: "Chen Li", email: "chen@example.com" },
  { name: "Divya Menon", email: "divya@example.com" },
];
const DEMO_PASSWORD = "demo-password";

const silent: EmailSender = { async send() {} };

/** Creates demo data. Safe to run repeatedly: existing demo Users are left as they are. */
export async function seed(db: Db, config: AuthConfig) {
  const auth = createAuth({ db, email: silent, config });
  for (const demo of DEMO_USERS) {
    if (db.select().from(user).where(eq(user.email, demo.email)).get()) continue;
    await auth.api.signUpEmail({
      body: { ...demo, password: DEMO_PASSWORD, currency: "INR" },
    });
    db.update(user).set({ emailVerified: true }).where(eq(user.email, demo.email)).run();
  }
}
