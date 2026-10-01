import { DEFAULT_GROUP_EMOJI, type AddGroupMembersInput, type CreateGroupInput } from "@plan-app/domain";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Balances } from "../balances/index.ts";
import type { Db, Tx } from "../db/client.ts";
import { activity, group, groupMember, person, user } from "../db/schema.ts";
import type { EmailSender } from "../email.ts";
import { NotFoundError, RuleError } from "../errors.ts";
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
    tx.insert(groupMember).values({ groupId: id, personId: me.id, joinedAt: now }).run();
    const found = addMembers(tx, me, id, emails);
    const audience = [me.id, ...found.map((f) => f.person.id)];
    recordActivity(tx, { type: "GroupCreated", actorId: me.id, subject: { type: "group", id }, groupId: id, audience });
    return found.filter((f) => f.invited).map((f) => f.person.email);
  });
  for (const e of invitedEmails) await sendInvite(emailSender, origin, me, e);
  return { id };
}

/**
 * Adds people (by email) to a Group: existing Persons or new Invited Persons. Each new member
 * is recorded as GroupMemberAdded for all members and friended with every other member.
 * Returns what was found or invited for each email; already-members are skipped.
 */
function addMembers(tx: Tx, me: Person, groupId: string, emails: string[]) {
  const existing = tx
    .select({ id: groupMember.personId })
    .from(groupMember)
    .where(eq(groupMember.groupId, groupId))
    .orderBy(groupMember.joinedAt)
    .all();
  const memberIds = new Set(existing.map((m) => m.id));
  const found = emails.map((e) => findOrInvitePerson(tx, me, e)).filter((f) => !memberIds.has(f.person.id));
  const start = Date.now();
  for (const [i, f] of found.entries()) {
    tx.insert(groupMember).values({ groupId, personId: f.person.id, joinedAt: new Date(start + i + 1) }).onConflictDoNothing().run();
    memberIds.add(f.person.id);
  }
  const audience = [...memberIds];
  for (const f of found) {
    recordActivity(tx, { type: "GroupMemberAdded", actorId: me.id, subject: { type: "person", id: f.person.id }, groupId, audience });
  }
  // Each new member is friended with everyone who joined before them, so FriendAdded is about the newcomer.
  for (const [i, f] of found.entries()) {
    const before = [...existing.map((m) => m.id), ...found.slice(0, i).map((x) => x.person.id)];
    for (const other of before) befriend(tx, me, other, f.person.id);
  }
  return found;
}

/** The Group, if I'm a member; otherwise NotFoundError (non-members can't tell it exists). */
function requireMembership(db: Db | Tx, me: Person, groupId: string) {
  const row = db
    .select({ g: group })
    .from(groupMember)
    .innerJoin(group, eq(group.id, groupMember.groupId))
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.personId, me.id)))
    .get();
  if (!row) throw new NotFoundError("Group not found");
  return row.g;
}

function requireActive(g: typeof group.$inferSelect) {
  if (g.archivedAt) throw new RuleError("This group is archived. Un-archive it to make changes.");
}

/** Any member adds more people to an active Group. */
export async function addGroupMembers({ db, email: emailSender, origin }: GroupsDeps, me: Person, groupId: string, input: AddGroupMembersInput) {
  const emails = [...new Set(input.emails.map(normalizeEmail))];
  const invited = db.transaction((tx) => {
    requireActive(requireMembership(tx, me, groupId));
    return addMembers(tx, me, groupId, emails).filter((f) => f.invited).map((f) => f.person.email);
  });
  for (const e of invited) await sendInvite(emailSender, origin, me, e);
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
