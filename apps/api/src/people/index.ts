import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db, Tx } from "../db/client.ts";
import type { EmailSender } from "../email.ts";
import { recordActivity } from "../activity/index.ts";
import { friendship, person } from "../db/schema.ts";

type AuthUser = { id: string; email: string; name: string; emailVerified: boolean };

/** The Invited Person waiting for this email, if any. */
export function invitedPersonFor(db: Db, email: string) {
  return db
    .select()
    .from(person)
    .where(and(eq(person.email, email.toLowerCase()), eq(person.status, "invited")))
    .get();
}

/**
 * Gives a new User their Person. If someone already invited this email, the User gets no
 * Person yet: the invite is claimed once the email is verified (see GLOSSARY: Invited Person).
 */
export function onUserCreated(db: Db, user: AuthUser) {
  if (invitedPersonFor(db, user.email)) {
    // A verified email (e.g. Google) can claim straight away.
    claimInvite(db, user);
    return;
  }
  db.insert(person)
    .values({ id: randomUUID(), userId: user.id, email: user.email, name: user.name, status: "active", createdAt: new Date() })
    .run();
}

/** Called whenever a User changes: verifying an email claims a waiting invite. */
export function onUserUpdated(db: Db, user: AuthUser) {
  claimInvite(db, user);
}

/**
 * A User with a verified email who has no Person yet claims the Invited Person with
 * that email: same Person, so its Friendships and history come with it.
 */
function claimInvite(db: Db, user: AuthUser) {
  if (!user.emailVerified) return;
  db.transaction((tx) => {
    if (tx.select().from(person).where(eq(person.userId, user.id)).get()) return;
    const invited = tx
      .select()
      .from(person)
      .where(and(eq(person.email, user.email.toLowerCase()), eq(person.status, "invited")))
      .get();
    if (!invited) return;
    tx.update(person).set({ userId: user.id, status: "active", name: user.name }).where(eq(person.id, invited.id)).run();
    const friends = tx.select({ id: friendship.friendId }).from(friendship).where(eq(friendship.personId, invited.id)).all();
    recordActivity(tx, {
      type: "InviteClaimed",
      actorId: invited.id,
      subject: { type: "person", id: invited.id },
      audience: [invited.id, ...friends.map((f) => f.id)],
    });
  });
}

type Person = typeof person.$inferSelect;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * The Person with this email, or a new Invited Person (recording PersonInvited).
 * `invited` is true only when the Invited Person was created now, i.e. an invite email is due.
 */
export function findOrInvitePerson(tx: Tx, actor: Person, rawEmail: string): { person: Person; invited: boolean } {
  const email = normalizeEmail(rawEmail);
  const existing = tx.select().from(person).where(eq(person.email, email)).get();
  if (existing) return { person: existing, invited: false };
  const created: Person = { id: randomUUID(), userId: null, email, name: email, status: "invited", createdAt: new Date() };
  tx.insert(person).values(created).run();
  recordActivity(tx, {
    type: "PersonInvited",
    actorId: actor.id,
    subject: { type: "person", id: created.id },
    audience: [actor.id, created.id],
  });
  return { person: created, invited: true };
}

/**
 * Makes `a` and `b` mutual Friends. Records FriendAdded (by `actor`, about `b`, the person
 * being added) only if they weren't Friends already.
 */
export function befriend(tx: Tx, actor: Person, aId: string, bId: string) {
  if (aId === bId) return;
  const now = new Date();
  const added = tx
    .insert(friendship)
    .values([
      { personId: aId, friendId: bId, createdAt: now },
      { personId: bId, friendId: aId, createdAt: now },
    ])
    .onConflictDoNothing()
    .run();
  if (added.changes > 0) {
    recordActivity(tx, {
      type: "FriendAdded",
      actorId: actor.id,
      subject: { type: "person", id: bId },
      audience: [aId, bId],
      data: { between: [aId, bId] },
    });
  }
}

/** Emails a join link to an Invited Person. Call after the transaction that invited them commits. */
export async function sendInvite(emailSender: EmailSender, origin: string, inviter: Person, email: string) {
  const link = new URL("/sign-up", origin);
  link.searchParams.set("email", email);
  await emailSender.send({
    to: email,
    subject: `${inviter.name} invited you to Plan App`,
    text: `${inviter.name} added you to split expenses together. Join to see what's shared with you.`,
    link: link.toString(),
  });
}
