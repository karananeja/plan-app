import { and, eq, like, or, sql } from "drizzle-orm";
import type { Balances } from "../balances/index.ts";
import type { Db } from "../db/client.ts";
import { friendship, person } from "../db/schema.ts";
import type { EmailSender } from "../email.ts";
import { RuleError } from "../errors.ts";
import { befriend, findOrInvitePerson, normalizeEmail, sendInvite } from "../people/index.ts";

export type FriendsDeps = { db: Db; email: EmailSender; origin: string };
type Person = typeof person.$inferSelect;

/**
 * Adds a mutual Friendship between `me` and the Person with `email`.
 * An unknown email becomes an Invited Person, who is emailed a join link.
 */
export async function addFriend({ db, email: emailSender, origin }: FriendsDeps, me: Person, email: string) {
  if (normalizeEmail(email) === me.email) throw new RuleError("You can't add yourself as a friend.");
  const { person: friend, invited } = db.transaction((tx) => {
    const found = findOrInvitePerson(tx, me, email);
    befriend(tx, me, me.id, found.person.id);
    return found;
  });
  if (invited) await sendInvite(emailSender, origin, me, friend.email);
}

/** My Friends with their Net Balances, optionally filtered by name or email. */
export function listFriends({ db, balances }: { db: Db; balances: Balances }, me: Person, q?: string) {
  const pattern = q?.trim() ? `%${q.trim().toLowerCase()}%` : undefined;
  return db
    .select({ personId: person.id, name: person.name, email: person.email, status: person.status })
    .from(friendship)
    .innerJoin(person, eq(person.id, friendship.friendId))
    .where(
      and(
        eq(friendship.personId, me.id),
        pattern ? or(like(sql`lower(${person.name})`, pattern), like(person.email, pattern)) : undefined,
      ),
    )
    .orderBy(person.name)
    .all()
    .map((f) => ({
      personId: f.personId,
      name: f.name,
      email: f.email,
      invited: f.status === "invited",
      netBalances: balances.netBalances(me.id, f.personId),
    }));
}
