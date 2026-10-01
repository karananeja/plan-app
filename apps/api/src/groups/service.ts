import { DEFAULT_GROUP_EMOJI, type AddGroupMembersInput, type CreateGroupInput, type UpdateGroupInput } from "@plan-app/domain";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Balances } from "../balances/index.ts";
import type { Db, Tx } from "../db/client.ts";
import { activity, expense, group, groupMember, person, user } from "../db/schema.ts";
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
export function requireMembership(db: Db | Tx, me: Person, groupId: string) {
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

/** Whether a Group has any (non-deleted) Expenses. Locks its currency and prevents deletion. */
function hasExpenses(tx: Db | Tx, groupId: string) {
  return Boolean(
    tx.select({ id: expense.id }).from(expense).where(and(eq(expense.groupId, groupId), isNull(expense.deletedAt))).get(),
  );
}

export function memberIds(tx: Db | Tx, groupId: string) {
  return tx.select({ id: groupMember.personId }).from(groupMember).where(eq(groupMember.groupId, groupId)).all().map((m) => m.id);
}

/** Any member edits an active Group. Records GroupUpdated with each changed field's from/to. */
export function updateGroup({ db }: GroupsDeps, me: Person, groupId: string, input: UpdateGroupInput) {
  db.transaction((tx) => {
    const g = requireMembership(tx, me, groupId);
    requireActive(g);
    const changes: Record<string, { from: string; to: string }> = {};
    for (const key of ["name", "emoji", "colour", "currency"] as const) {
      const to = input[key];
      if (to !== undefined && to !== g[key]) changes[key] = { from: g[key], to };
    }
    if (Object.keys(changes).length === 0) return;
    if (changes.currency && hasExpenses(tx, groupId)) {
      throw new RuleError("The currency can't be changed once the group has expenses.");
    }
    tx.update(group)
      .set(Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.to])))
      .where(eq(group.id, groupId))
      .run();
    recordActivity(tx, {
      type: "GroupUpdated",
      actorId: me.id,
      subject: { type: "group", id: groupId },
      groupId,
      audience: memberIds(tx, groupId),
      data: { changes },
    });
  });
}

/** Any member archives a Group once every member is Settled Up in it. */
export function archiveGroup({ db, balances }: GroupsDeps, me: Person, groupId: string) {
  db.transaction((tx) => {
    const g = requireMembership(tx, me, groupId);
    requireActive(g);
    const members = memberIds(tx, groupId);
    if (members.some((id) => balances.groupBalances(groupId, id).length > 0)) {
      throw new RuleError("Everyone needs to be settled up before this group can be archived.");
    }
    tx.update(group).set({ archivedAt: new Date() }).where(eq(group.id, groupId)).run();
    recordActivity(tx, { type: "GroupArchived", actorId: me.id, subject: { type: "group", id: groupId }, groupId, audience: members });
  });
}

/** Any member un-archives a Group. Recorded as GroupUpdated (archived: true → false). */
export function unarchiveGroup({ db }: GroupsDeps, me: Person, groupId: string) {
  db.transaction((tx) => {
    const g = requireMembership(tx, me, groupId);
    if (!g.archivedAt) return;
    tx.update(group).set({ archivedAt: null }).where(eq(group.id, groupId)).run();
    recordActivity(tx, {
      type: "GroupUpdated",
      actorId: me.id,
      subject: { type: "group", id: groupId },
      groupId,
      audience: memberIds(tx, groupId),
      data: { changes: { archived: { from: true, to: false } } },
    });
  });
}

/**
 * The creator deletes a Group (Spec 02 will also require it to have no Expenses).
 * Members are told through GroupDeleted; past Activity is kept so history still makes sense.
 */
export function deleteGroup({ db }: GroupsDeps, me: Person, groupId: string) {
  db.transaction((tx) => {
    const g = requireMembership(tx, me, groupId);
    if (g.createdById !== me.id) throw new RuleError("Only the person who created this group can delete it.");
    if (hasExpenses(tx, groupId)) throw new RuleError("A group with expenses can't be deleted. Archive it instead.");
    recordActivity(tx, {
      type: "GroupDeleted",
      actorId: me.id,
      subject: { type: "group", id: groupId },
      groupId,
      audience: memberIds(tx, groupId),
      data: { name: g.name },
    });
    tx.delete(groupMember).where(eq(groupMember.groupId, groupId)).run();
    tx.delete(group).where(eq(group.id, groupId)).run();
  });
}

function requireSettledUp(balances: Balances, groupId: string, personId: string, message: string) {
  if (balances.groupBalances(groupId, personId).length > 0) throw new RuleError(message);
}

/** I leave a Group. Allowed only when my Group Balance is zero. Friendships made through it stay. */
export function leaveGroup({ db, balances }: GroupsDeps, me: Person, groupId: string) {
  db.transaction((tx) => {
    requireMembership(tx, me, groupId);
    const audience = memberIds(tx, groupId);
    if (audience.length === 1) throw new RuleError("You're the last member. Archive or delete the group instead.");
    requireSettledUp(balances, groupId, me.id, "You need to settle up in this group before you can leave it.");
    tx.delete(groupMember).where(and(eq(groupMember.groupId, groupId), eq(groupMember.personId, me.id))).run();
    recordActivity(tx, { type: "GroupMemberLeft", actorId: me.id, subject: { type: "person", id: me.id }, groupId, audience });
  });
}

/** Any member removes another member whose Group Balance is zero. The removed person is in the audience. */
export function removeGroupMember({ db, balances }: GroupsDeps, me: Person, groupId: string, personId: string) {
  db.transaction((tx) => {
    requireMembership(tx, me, groupId);
    const audience = memberIds(tx, groupId);
    if (!audience.includes(personId)) throw new NotFoundError("That person isn't in this group");
    if (personId === me.id) throw new RuleError("To leave the group yourself, use Leave.");
    requireSettledUp(balances, groupId, personId, "They need to settle up in this group before they can be removed.");
    tx.delete(groupMember).where(and(eq(groupMember.groupId, groupId), eq(groupMember.personId, personId))).run();
    recordActivity(tx, { type: "GroupMemberRemoved", actorId: me.id, subject: { type: "person", id: personId }, groupId, audience });
  });
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
