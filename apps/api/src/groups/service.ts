import { DEFAULT_GROUP_EMOJI, type CreateGroupInput } from "@plan-app/domain";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Balances } from "../balances/index.ts";
import type { Db } from "../db/client.ts";
import { activity, group, groupMember, person, user } from "../db/schema.ts";
import type { EmailSender } from "../email.ts";
import { NotFoundError } from "../errors.ts";
import { recordActivity } from "../activity/index.ts";
import { befriend, findOrInvitePerson, normalizeEmail, sendInvite } from "../people/index.ts";

type Person = typeof person.$inferSelect;
export type GroupsDeps = { db: Db; balances: Balances; email: EmailSender; origin: string };

function profileCurrency(db: Db, me: Person): string {
  if (!me.userId) return "USD";
  return db.select({ currency: user.currency }).from(user).where(eq(user.id, me.userId)).get()?.currency ?? "USD";
}

/**
 * Creates a Group with me and the given members (Friends, other Users, or new emails, which
 * become Invited Persons). Every member ends up Friends with every other member.
 */
export async function createGroup({ db, email: emailSender, origin }: GroupsDeps, me: Person, input: CreateGroupInput) {
  const id = randomUUID();
  const now = new Date();
  const emails = [...new Set(input.memberEmails.map(normalizeEmail))].filter((e) => e !== me.email);
  const invitedEmails = db.transaction((tx) => {
    tx.insert(group)
      .values({
        id,
        name: input.name,
        type: input.type,
        emoji: input.emoji ?? DEFAULT_GROUP_EMOJI[input.type],
        colour: input.colour,
        currency: input.currency ?? profileCurrency(db, me),
        createdById: me.id,
        createdAt: now,
      })
      .run();
    const found = emails.map((e) => findOrInvitePerson(tx, me, e));
    const members = [me, ...found.map((f) => f.person)];
    tx.insert(groupMember)
      .values(members.map((m, i) => ({ groupId: id, personId: m.id, joinedAt: new Date(now.getTime() + i) })))
      .run();
    const audience = members.map((m) => m.id);
    recordActivity(tx, { type: "GroupCreated", actorId: me.id, subject: { type: "group", id }, groupId: id, audience });
    for (const m of members.slice(1)) {
      recordActivity(tx, { type: "GroupMemberAdded", actorId: me.id, subject: { type: "person", id: m.id }, groupId: id, audience });
    }
    for (const [i, a] of members.entries()) for (const b of members.slice(i + 1)) befriend(tx, me, a.id, b.id);
    return found.filter((f) => f.invited).map((f) => f.person.email);
  });
  for (const e of invitedEmails) await sendInvite(emailSender, origin, me, e);
  return { id };
}

const memberCount = sql<number>`(select count(*) from ${groupMember} gm where gm.group_id = ${group.id})`;
const lastActivityAt = sql<number>`coalesce((select max(${activity.occurredAt}) from ${activity} where ${activity.groupId} = ${group.id}), ${group.createdAt})`;

/** My Groups, most recently active first. */
export function listGroups({ db }: GroupsDeps, me: Person) {
  return db
    .select({
      id: group.id,
      name: group.name,
      type: group.type,
      emoji: group.emoji,
      colour: group.colour,
      currency: group.currency,
      archived: sql<boolean>`${group.archivedAt} is not null`.mapWith(Boolean),
      memberCount,
    })
    .from(groupMember)
    .innerJoin(group, eq(group.id, groupMember.groupId))
    .where(eq(groupMember.personId, me.id))
    .orderBy(desc(lastActivityAt))
    .all();
}

/** A Group I belong to, with its members and their Group Balances. Not a member → NotFoundError. */
export function getGroup({ db, balances }: GroupsDeps, me: Person, groupId: string) {
  const isMember = db
    .select()
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.personId, me.id)))
    .get();
  const g = isMember && db.select().from(group).where(eq(group.id, groupId)).get();
  if (!g) throw new NotFoundError("Group not found");
  const members = db
    .select({ personId: person.id, name: person.name, email: person.email, status: person.status })
    .from(groupMember)
    .innerJoin(person, eq(person.id, groupMember.personId))
    .where(eq(groupMember.groupId, groupId))
    .orderBy(groupMember.joinedAt, person.name)
    .all();
  return {
    id: g.id,
    name: g.name,
    type: g.type,
    emoji: g.emoji,
    colour: g.colour,
    currency: g.currency,
    archived: g.archivedAt !== null,
    createdById: g.createdById,
    memberCount: members.length,
    members: members.map((m) => ({
      personId: m.personId,
      name: m.name,
      email: m.email,
      invited: m.status === "invited",
      groupBalances: balances.groupBalances(groupId, m.personId),
    })),
  };
}
