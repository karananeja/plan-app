import {
  describeRemaining,
  fromMinorUnits,
  parseSplitValue,
  splitExpense,
  toMinorUnits,
  type CreateExpenseInput,
  type CreateNonGroupExpenseInput,
  type SplitMethod,
} from "@plan-app/domain";
import { and, desc, eq, exists, inArray, isNull, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db, Tx } from "../db/client.ts";
import { expense, expenseParticipant, friendship, group, person, user } from "../db/schema.ts";
import { NotFoundError, RuleError } from "../errors.ts";
import { recordActivity } from "../activity/index.ts";
import { memberIds, requireMembership } from "../groups/service.ts";
import type { EmailSender } from "../email.ts";
import { befriend, findOrInvitePerson, sendInvite } from "../people/index.ts";

type Person = typeof person.$inferSelect;
export type ExpensesDeps = { db: Db };
export type NonGroupExpensesDeps = ExpensesDeps & { email: EmailSender; origin: string };

/** What an Expense means for one viewer: money they lent, money they owe, or nothing. */
export type Effect = { kind: "lent" | "owe" | "none"; amountMinor: number };

function effectFor(viewerId: string, payerId: string, totalMinor: number, shares: { personId: string; shareMinor: number }[]): Effect {
  const mine = shares.find((s) => s.personId === viewerId)?.shareMinor ?? 0;
  if (viewerId === payerId) return { kind: "lent", amountMinor: totalMinor - mine };
  if (mine > 0) return { kind: "owe", amountMinor: mine };
  return { kind: "none", amountMinor: 0 };
}

function toMinor(amount: string, currency: string): number {
  try {
    return toMinorUnits(amount, currency);
  } catch (e) {
    throw new RuleError((e as Error).message);
  }
}

/** Reads what was typed for each Participant (see parseSplitValue), as a 400 if malformed. */
function parseValue(method: SplitMethod, value: string | undefined, currency: string): number | undefined {
  try {
    return parseSplitValue(method, value, currency);
  } catch (e) {
    throw new RuleError((e as Error).message);
  }
}

/** The stored input shown back for editing: an amount, a percent or a number of shares. */
function formatInput(method: string, input: number | null, currency: string): string | null {
  if (input === null) return null;
  if (method === "exact") return fromMinorUnits(input, currency);
  if (method === "percentage") return (input / 100).toFixed(2);
  return String(input);
}

type ExpenseDetails = Pick<CreateExpenseInput, "description" | "amount" | "date" | "category" | "note" | "payerId" | "method"> & {
  participants: { personId: string; value?: string }[];
};

/**
 * Validates the Split and writes an Expense with its Participants, recording ExpenseCreated
 * for `audience`. The one place Expenses are written, for Group and non-group alike.
 */
function recordExpense(
  tx: Tx,
  me: Person,
  where: { groupId: string | null; currency: string; audience: string[] },
  input: ExpenseDetails,
) {
  const { groupId, currency, audience } = where;
  const totalMinor = toMinor(input.amount, currency);
  const participants = input.participants.map((p) => ({ personId: p.personId, value: parseValue(input.method, p.value, currency) }));
  const split = splitExpense({ totalMinor, method: input.method, participants });
  if (!split.ok) {
    const { remaining } = split;
    if (remaining !== undefined && (input.method === "exact" || input.method === "percentage")) {
      throw new RuleError(describeRemaining(input.method, remaining, currency), { remaining });
    }
    throw new RuleError(split.error.message);
  }
  const id = randomUUID();
  const now = new Date();
  tx.insert(expense)
    .values({
      id, groupId, description: input.description, category: input.category, date: input.date, currency,
      totalMinor, payerId: input.payerId, method: input.method, note: input.note ?? null, createdById: me.id,
      createdAt: now, updatedAt: now,
    })
    .run();
  tx.insert(expenseParticipant)
    .values(
      split.shares.map((s, position) => ({
        expenseId: id, personId: s.personId, position, input: participants[position]!.value ?? null, shareMinor: s.shareMinor,
      })),
    )
    .run();
  recordActivity(tx, {
    type: "ExpenseCreated",
    actorId: me.id,
    subject: { type: "expense", id },
    groupId: groupId ?? undefined,
    audience,
    data: { description: input.description, totalMinor, currency },
  });
  return { id };
}

/** A Group Member records an Expense in the Group's currency. */
export function createGroupExpense({ db }: ExpensesDeps, me: Person, groupId: string, input: CreateExpenseInput) {
  return db.transaction((tx) => {
    const g = requireMembership(tx, me, groupId);
    const members = memberIds(tx, groupId);
    const memberSet = new Set(members);
    if (![input.payerId, ...input.participants.map((p) => p.personId)].every((pid) => memberSet.has(pid))) {
      throw new RuleError("Everyone on a group expense must be a member of the group.");
    }
    if (g.archivedAt) {
      // Spending in an archived Group brings it back (Spec 01).
      tx.update(group).set({ archivedAt: null }).where(eq(group.id, groupId)).run();
      recordActivity(tx, {
        type: "GroupUpdated",
        actorId: me.id,
        subject: { type: "group", id: groupId },
        groupId,
        audience: members,
        data: { changes: { archived: { from: true, to: false } } },
      });
    }
    return recordExpense(tx, me, { groupId, currency: g.currency, audience: members }, input);
  });
}

function friendIds(tx: Db | Tx, personId: string) {
  return new Set(tx.select({ id: friendship.friendId }).from(friendship).where(eq(friendship.personId, personId)).all().map((f) => f.id));
}

function profileCurrency(tx: Db | Tx, me: Person) {
  if (!me.userId) return "USD";
  return tx.select({ currency: user.currency }).from(user).where(eq(user.id, me.userId)).get()?.currency ?? "USD";
}

/**
 * Records an Expense outside any Group with me and my Friends. I must be on it (as Payer or
 * Participant), since non-group Expenses are visible only to the people on them.
 */
export async function createNonGroupExpense({ db, email, origin }: NonGroupExpensesDeps, me: Person, input: CreateNonGroupExpenseInput) {
  const { id, invited } = db.transaction((tx) => {
    const allowed = friendIds(tx, me.id).add(me.id);
    const invited: string[] = [];
    const people = input.participants.map((p) => {
      if (!("email" in p)) return { personId: p.personId, value: p.value };
      // Someone new (or not yet my Friend), added by email.
      const found = findOrInvitePerson(tx, me, p.email);
      if (found.invited) invited.push(found.person.email);
      allowed.add(found.person.id);
      return { personId: found.person.id, value: p.value };
    });
    const involved = [input.payerId, ...people.map((p) => p.personId)];
    if (!involved.every((pid) => allowed.has(pid))) {
      throw new RuleError("You can only split with yourself and your friends.");
    }
    if (!involved.includes(me.id)) {
      throw new RuleError("You need to be on the expense, as the payer or one of the people splitting it.");
    }
    const audience = [...new Set(involved)];
    // Everyone on the Expense becomes Friends with everyone else on it (Spec 01).
    for (const [i, a] of audience.entries()) for (const b of audience.slice(i + 1)) befriend(tx, me, a, b);
    const currency = input.currency ?? profileCurrency(tx, me);
    return { ...recordExpense(tx, me, { groupId: null, currency, audience }, { ...input, participants: people }), invited };
  });
  for (const address of invited) await sendInvite(email, origin, me, address);
  return { id };
}

type Share = { personId: string; name: string; shareMinor: number; input: number | null };

function sharesFor(db: Db, expenseIds: string[]) {
  if (expenseIds.length === 0) return new Map<string, Share[]>();
  const rows = db
    .select({
      expenseId: expenseParticipant.expenseId, personId: person.id, name: person.name,
      shareMinor: expenseParticipant.shareMinor, input: expenseParticipant.input,
    })
    .from(expenseParticipant)
    .innerJoin(person, eq(person.id, expenseParticipant.personId))
    .where(inArray(expenseParticipant.expenseId, expenseIds))
    .orderBy(expenseParticipant.position)
    .all();
  const byExpense = new Map<string, Share[]>();
  for (const { expenseId, ...share } of rows) byExpense.set(expenseId, [...(byExpense.get(expenseId) ?? []), share]);
  return byExpense;
}

function summaries(db: Db, me: Person, rows: (typeof expense.$inferSelect & { payerName: string })[]) {
  const shares = sharesFor(db, rows.map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    date: r.date,
    category: r.category,
    currency: r.currency,
    totalMinor: r.totalMinor,
    payer: { personId: r.payerId, name: r.payerName },
    myEffect: effectFor(me.id, r.payerId, r.totalMinor, shares.get(r.id) ?? []),
  }));
}

/** A Group's Expenses, newest bill date first. Members only. */
export function listGroupExpenses({ db }: ExpensesDeps, me: Person, groupId: string) {
  requireMembership(db, me, groupId);
  const rows = db
    .select({ e: expense, payerName: person.name })
    .from(expense)
    .innerJoin(person, eq(person.id, expense.payerId))
    .where(and(eq(expense.groupId, groupId), isNull(expense.deletedAt)))
    .orderBy(desc(expense.date), desc(expense.createdAt))
    .all();
  return summaries(db, me, rows.map((r) => ({ ...r.e, payerName: r.payerName })));
}

function isInvolved(db: Db, personId: string, e: typeof expense.$inferSelect) {
  if (e.payerId === personId) return true;
  return Boolean(
    db.select().from(expenseParticipant).where(and(eq(expenseParticipant.expenseId, e.id), eq(expenseParticipant.personId, personId))).get(),
  );
}

/** SQL condition: `personId` is the Payer of, or a Participant in, the Expense. */
function involves(db: Db, personId: string) {
  return or(
    eq(expense.payerId, personId),
    exists(
      db.select({ one: expenseParticipant.personId }).from(expenseParticipant)
        .where(and(eq(expenseParticipant.expenseId, expense.id), eq(expenseParticipant.personId, personId))),
    ),
  );
}

/** A Friend and the non-group Expenses we're both on, newest bill date first. Friends only. */
export function getFriendPage({ db }: ExpensesDeps, me: Person, friendId: string) {
  if (!friendIds(db, me.id).has(friendId)) throw new NotFoundError("Friend not found");
  const friend = db.select().from(person).where(eq(person.id, friendId)).get()!;
  const rows = db
    .select({ e: expense, payerName: person.name })
    .from(expense)
    .innerJoin(person, eq(person.id, expense.payerId))
    .where(and(isNull(expense.groupId), isNull(expense.deletedAt), involves(db, me.id), involves(db, friendId)))
    .orderBy(desc(expense.date), desc(expense.createdAt))
    .all();
  return {
    personId: friend.id,
    name: friend.name,
    email: friend.email,
    invited: friend.status === "invited",
    expenses: summaries(db, me, rows.map((r) => ({ ...r.e, payerName: r.payerName }))),
  };
}

/** One Expense with every Share. Group Expenses: visible to Group Members. Non-group: to the people on it. */
export function getExpense({ db }: ExpensesDeps, me: Person, expenseId: string) {
  const row = db
    .select({ e: expense, payerName: person.name })
    .from(expense)
    .innerJoin(person, eq(person.id, expense.payerId))
    .where(eq(expense.id, expenseId))
    .get();
  if (!row) throw new NotFoundError("Expense not found");
  if (row.e.groupId) requireMembership(db, me, row.e.groupId);
  else if (!isInvolved(db, me.id, row.e)) throw new NotFoundError("Expense not found");
  const [summary] = summaries(db, me, [{ ...row.e, payerName: row.payerName }]);
  return {
    ...summary!,
    groupId: row.e.groupId,
    method: row.e.method,
    note: row.e.note,
    version: row.e.version,
    shares: (sharesFor(db, [expenseId]).get(expenseId) ?? []).map((s) => ({
      ...s,
      input: formatInput(row.e.method, s.input, row.e.currency),
    })),
  };
}

