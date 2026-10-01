import { and, eq, like, or, sql } from "drizzle-orm";
import { recordActivity } from "../activity/index.ts";
import type { Balances } from "../balances/index.ts";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/client.ts";
import { friendship, person } from "../db/schema.ts";
import type { EmailSender } from "../email.ts";
import { RuleError } from "../errors.ts";

export type FriendsDeps = { db: Db; email: EmailSender; origin: string };

type Person = typeof person.$inferSelect;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Adds a mutual Friendship between `me` and the Person with `email`.
 * An unknown email becomes an Invited Person, who is emailed a join link.
 */
export async function addFriend({ db, email: emailSender, origin }: FriendsDeps, me: Person, email: string) {
  const friendEmail = normalizeEmail(email);
  if (friendEmail === me.email) throw new RuleError("You can't add yourself as a friend.");
  const invited = db.transaction((tx) => {
    const now = new Date();
    let friend = tx.select().from(person).where(eq(person.email, friendEmail)).get();
    const isNew = !friend;
    if (!friend) {
      friend = { id: randomUUID(), userId: null, email: friendEmail, name: friendEmail, status: "invited", createdAt: now };
      tx.insert(person).values(friend).run();
      recordActivity(tx, {
        type: "PersonInvited",
        actorId: me.id,
        subject: { type: "person", id: friend.id },
        audience: [me.id, friend.id],
      });
    }
    const added = tx
      .insert(friendship)
      .values([
        { personId: me.id, friendId: friend.id, createdAt: now },
        { personId: friend.id, friendId: me.id, createdAt: now },
      ])
      .onConflictDoNothing()
      .run();
    if (added.changes > 0) {
      recordActivity(tx, {
        type: "FriendAdded",
        actorId: me.id,
        subject: { type: "person", id: friend.id },
        audience: [me.id, friend.id],
      });
    }
    return isNew;
  });

  if (invited) {
    const link = new URL("/sign-up", origin);
    link.searchParams.set("email", friendEmail);
    await emailSender.send({
      to: friendEmail,
      subject: `${me.name} invited you to Plan App`,
      text: `${me.name} added you as a friend to split expenses. Join to see what's shared with you.`,
      link: link.toString(),
    });
  }
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
