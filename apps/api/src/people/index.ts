import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/client.ts";
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
