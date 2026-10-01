import { splitExpense, toMinorUnits, type CreateExpenseInput } from "@plan-app/domain";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/client.ts";
import { expense, expenseParticipant, group, person } from "../db/schema.ts";
import { NotFoundError, RuleError } from "../errors.ts";
import { recordActivity } from "../activity/index.ts";
import { memberIds, requireMembership } from "../groups/service.ts";

type Person = typeof person.$inferSelect;
export type ExpensesDeps = { db: Db };

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

/** A Group Member records an Expense in the Group's currency. */
export function createGroupExpense({ db }: ExpensesDeps, me: Person, groupId: string, input: CreateExpenseInput) {
  const id = randomUUID();
  db.transaction((tx) => {
    const g = requireMembership(tx, me, groupId);
    const members = new Set(memberIds(tx, groupId));
    if (![input.payerId, ...input.participantIds].every((pid) => members.has(pid))) {
      throw new RuleError("Everyone on a group expense must be a member of the group.");
    }
    const totalMinor = toMinor(input.amount, g.currency);
    const split = splitExpense({ totalMinor, method: input.method, participants: input.participantIds.map((personId) => ({ personId })) });
    if (!split.ok) throw new RuleError(split.error.message);
    const now = new Date();
    tx.insert(expense)
      .values({
        id, groupId, description: input.description, category: input.category, date: input.date, currency: g.currency,
        totalMinor, payerId: input.payerId, method: input.method, note: input.note ?? null, createdById: me.id,
        createdAt: now, updatedAt: now,
      })
      .run();
    tx.insert(expenseParticipant)
      .values(split.shares.map((s, position) => ({ expenseId: id, personId: s.personId, position, input: null, shareMinor: s.shareMinor })))
      .run();
    if (g.archivedAt) {
      // Spending in an archived Group brings it back (Spec 01).
      tx.update(group).set({ archivedAt: null }).where(eq(group.id, groupId)).run();
      recordActivity(tx, {
        type: "GroupUpdated",
        actorId: me.id,
        subject: { type: "group", id: groupId },
        groupId,
        audience: memberIds(tx, groupId),
        data: { changes: { archived: { from: true, to: false } } },
      });
    }
    recordActivity(tx, {
      type: "ExpenseCreated",
      actorId: me.id,
      subject: { type: "expense", id },
      groupId,
      audience: memberIds(tx, groupId),
      data: { description: input.description, totalMinor, currency: g.currency },
    });
  });
  return { id };
}

function sharesFor(db: Db, expenseIds: string[]) {
  if (expenseIds.length === 0) return new Map<string, { personId: string; name: string; shareMinor: number }[]>();
  const rows = db
    .select({ expenseId: expenseParticipant.expenseId, personId: person.id, name: person.name, shareMinor: expenseParticipant.shareMinor })
    .from(expenseParticipant)
    .innerJoin(person, eq(person.id, expenseParticipant.personId))
    .where(inArray(expenseParticipant.expenseId, expenseIds))
    .orderBy(expenseParticipant.position)
    .all();
  const byExpense = new Map<string, { personId: string; name: string; shareMinor: number }[]>();
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

/** One Expense with every Share. Visible to Group Members (group Expense). */
export function getExpense({ db }: ExpensesDeps, me: Person, expenseId: string) {
  const row = db
    .select({ e: expense, payerName: person.name })
    .from(expense)
    .innerJoin(person, eq(person.id, expense.payerId))
    .where(eq(expense.id, expenseId))
    .get();
  if (!row) throw new NotFoundError("Expense not found");
  if (row.e.groupId) requireMembership(db, me, row.e.groupId);
  else throw new NotFoundError("Expense not found");
  const [summary] = summaries(db, me, [{ ...row.e, payerName: row.payerName }]);
  return {
    ...summary!,
    groupId: row.e.groupId,
    method: row.e.method,
    note: row.e.note,
    version: row.e.version,
    shares: sharesFor(db, [expenseId]).get(expenseId) ?? [],
  };
}

