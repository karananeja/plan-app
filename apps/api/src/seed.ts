import { createExpenseInput, createGroupInput, createNonGroupExpenseInput } from "@plan-app/domain";
import { and, eq, isNull } from "drizzle-orm";
import { createAuth, type AuthConfig } from "./auth.ts";
import type { Db } from "./db/client.ts";
import { expense, group, person, user } from "./db/schema.ts";
import { createGroupExpense, createNonGroupExpense } from "./expenses/service.ts";
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

/** Demo Group Expenses: [group, description, amount, date, category, payer, participants]. */
const DEMO_GROUP_EXPENSES = [
  ["Goa Trip", "Beach shack dinner", "3200", "2026-09-20", "food", "asha", ["asha", "ben", "chen", "divya"]],
  ["Goa Trip", "Scooter rental", "1800", "2026-09-21", "travel", "ben", ["asha", "ben", "chen", "divya"]],
  ["Goa Trip", "Parasailing", "2500", "2026-09-22", "entertainment", "chen", ["ben", "chen"]],
  ["Flat 4B", "Electricity bill", "2140", "2026-09-05", "utilities", "asha", ["asha", "ben"]],
] as const;

/** Demo non-group Expenses: [description, amount, date, category, payer, participants]. */
const DEMO_FRIEND_EXPENSES = [
  ["Concert tickets", "3000", "2026-09-12", "entertainment", "divya", ["asha", "divya"]],
  ["Coffee", "480", "2026-09-25", "food", "asha", ["asha", "divya"]],
] as const;

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

  const personByName = (name: string) => db.select().from(person).where(eq(person.email, `${name}@example.com`)).get()!;
  for (const [groupName, description, amount, date, category, payer, participants] of DEMO_GROUP_EXPENSES) {
    const g = db.select().from(group).where(and(eq(group.name, groupName), eq(group.createdById, asha.id))).get();
    if (!g) continue;
    const exists = db.select().from(expense).where(and(eq(expense.groupId, g.id), eq(expense.description, description))).get();
    if (exists) continue;
    const payerPerson = personByName(payer);
    createGroupExpense(
      { db },
      payerPerson,
      g.id,
      createExpenseInput.parse({
        description, amount, date, category, method: "equal",
        payerId: payerPerson.id,
        participants: participants.map((n) => ({ personId: personByName(n).id })),
      }),
    );
  }

  for (const [description, amount, date, category, payer, participants] of DEMO_FRIEND_EXPENSES) {
    const exists = db.select().from(expense).where(and(isNull(expense.groupId), eq(expense.description, description))).get();
    if (exists) continue;
    const payerPerson = personByName(payer);
    await createNonGroupExpense(
      { db, email: silent, origin: config.origin },
      payerPerson,
      createNonGroupExpenseInput.parse({
        description, amount, date, category, method: "equal", currency: "INR",
        payerId: payerPerson.id,
        participants: participants.map((n) => ({ personId: personByName(n).id })),
      }),
    );
  }
}
