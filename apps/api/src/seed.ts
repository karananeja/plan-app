import { createGroupInput } from "@plan-app/domain";
import { and, eq } from "drizzle-orm";
import { createAuth, type AuthConfig } from "./auth.ts";
import type { Db } from "./db/client.ts";
import { group, person, user } from "./db/schema.ts";
import { createGroup } from "./groups/service.ts";
import { noTransactionsYet } from "./balances/index.ts";
import type { EmailSender } from "./email.ts";

/** Demo logins for trying the app as several people. Documented in the README. */
const DEMO_USERS = [
  { name: "Asha Rao", email: "asha@example.com" },
  { name: "Ben Thomas", email: "ben@example.com" },
  { name: "Chen Li", email: "chen@example.com" },
  { name: "Divya Menon", email: "divya@example.com" },
];
const DEMO_PASSWORD = "demo-password";

/** Demo Groups, created by Asha. */
const DEMO_GROUPS = [
  { name: "Goa Trip", type: "trip", memberEmails: ["ben@example.com", "chen@example.com", "divya@example.com"] },
  { name: "Flat 4B", type: "home", memberEmails: ["ben@example.com"] },
] as const;

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

  const asha = db.select().from(person).where(eq(person.email, "asha@example.com")).get()!;
  const deps = { db, balances: noTransactionsYet, email: silent, origin: config.origin };
  for (const demo of DEMO_GROUPS) {
    const exists = db.select().from(group).where(and(eq(group.name, demo.name), eq(group.createdById, asha.id))).get();
    if (!exists) await createGroup(deps, asha, createGroupInput.parse({ ...demo, memberEmails: [...demo.memberEmails] }));
  }
}
