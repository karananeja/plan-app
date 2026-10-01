import { alias } from "drizzle-orm/sqlite-core";
import { and, eq, isNull, like, or, sql } from "drizzle-orm";
import type { Balances } from "../balances/index.ts";
import type { Db } from "../db/client.ts";
import { friendship, group, groupMember, person } from "../db/schema.ts";
import type { EmailSender } from "../email.ts";
import { NotFoundError, RuleError } from "../errors.ts";
import { recordActivity } from "../activity/index.ts";
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

/** Non-archived Groups both people belong to. */
function sharedActiveGroups(db: Db, aId: string, bId: string) {
  const other = alias(groupMember, "other");
  return db
    .select({ name: group.name })
    .from(groupMember)
    .innerJoin(other, and(eq(other.groupId, groupMember.groupId), eq(other.personId, bId)))
    .innerJoin(group, eq(group.id, groupMember.groupId))
    .where(and(eq(groupMember.personId, aId), isNull(group.archivedAt)))
    .orderBy(group.name)
    .all();
}

/**
 * Removes a Friendship (both directions). Not while money is owed either way, and not while
 * the two share an active Group (being in a Group together would make them Friends again).
 */
export function removeFriend({ db, balances }: { db: Db; balances: Balances }, me: Person, friendId: string) {
  const shared = sharedActiveGroups(db, me.id, friendId);
  if (shared.length > 0) {
    throw new RuleError(`You can't remove a friend you share a group with: ${shared.map((g) => g.name).join(", ")}.`);
  }
  if (balances.netBalances(me.id, friendId).length > 0) {
    throw new RuleError("You need to be settled up before removing this friend.");
  }
  db.transaction((tx) => {
    const removed = tx
      .delete(friendship)
      .where(
        or(
          and(eq(friendship.personId, me.id), eq(friendship.friendId, friendId)),
          and(eq(friendship.personId, friendId), eq(friendship.friendId, me.id)),
        ),
      )
      .run();
    if (removed.changes === 0) throw new NotFoundError("Friend not found");
    recordActivity(tx, { type: "FriendRemoved", actorId: me.id, subject: { type: "person", id: friendId }, audience: [me.id, friendId] });
  });
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
