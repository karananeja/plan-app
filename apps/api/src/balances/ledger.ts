import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { expense, expenseParticipant } from "../db/schema.ts";
import type { Balances, CurrencyAmount, GroupDebt } from "./index.ts";

/** Non-zero totals per currency, in a stable order. */
function nonZero(rows: { currency: string; amount: number | null }[]): CurrencyAmount[] {
  return rows
    .map((r) => ({ currency: r.currency, amount: Number(r.amount ?? 0) }))
    .filter((r) => r.amount !== 0)
    .sort((x, y) => x.currency.localeCompare(y.currency));
}

/**
 * Balances derived from the Ledger (ADR 0001): every Participant other than the Payer owes
 * the Payer their Share, on each non-deleted Expense. Nothing is stored; every call recomputes.
 */
export function ledgerBalances(db: Db): Balances {
  /** Debts: one row per (debtor, creditor) Share, from non-deleted Expenses. */
  const debts = () =>
    db
      .select({
        debtor: expenseParticipant.personId,
        creditor: expense.payerId,
        currency: expense.currency,
        groupId: expense.groupId,
        amount: expenseParticipant.shareMinor,
      })
      .from(expenseParticipant)
      .innerJoin(expense, eq(expense.id, expenseParticipant.expenseId))
      .where(and(isNull(expense.deletedAt), ne(expenseParticipant.personId, expense.payerId)))
      .as("debts");

  return {
    netBalances(me, other) {
      const d = debts();
      const rows = db
        .select({
          currency: d.currency,
          amount: sql<number>`sum(case when ${d.creditor} = ${me} then ${d.amount} else -${d.amount} end)`,
        })
        .from(d)
        .where(or(and(eq(d.creditor, me), eq(d.debtor, other)), and(eq(d.creditor, other), eq(d.debtor, me))))
        .groupBy(d.currency)
        .all();
      return nonZero(rows);
    },
    groupBalances(groupId, personId) {
      const d = debts();
      const rows = db
        .select({
          currency: d.currency,
          amount: sql<number>`sum(case when ${d.creditor} = ${personId} then ${d.amount} else -${d.amount} end)`,
        })
        .from(d)
        .where(and(eq(d.groupId, groupId), or(eq(d.creditor, personId), eq(d.debtor, personId))))
        .groupBy(d.currency)
        .all();
      return nonZero(rows);
    },
    groupDebts(groupId) {
      const d = debts();
      const rows = db
        .select({ debtor: d.debtor, creditor: d.creditor, currency: d.currency, amount: sql<number>`sum(${d.amount})` })
        .from(d)
        .where(eq(d.groupId, groupId))
        .groupBy(d.debtor, d.creditor, d.currency)
        .all();
      // Net each pair: what x owes y minus what y owes x.
      const net = new Map<string, GroupDebt>();
      for (const r of rows) {
        const [x, y] = [r.debtor, r.creditor].sort() as [string, string];
        const key = `${x}|${y}|${r.currency}`;
        const signed = (r.debtor === x ? 1 : -1) * Number(r.amount);
        const prev = net.get(key)?.amount ?? 0;
        net.set(key, { fromId: x, toId: y, currency: r.currency, amount: prev + signed });
      }
      return [...net.values()]
        .filter((debt) => debt.amount !== 0)
        .map((debt) => (debt.amount > 0 ? debt : { fromId: debt.toId, toId: debt.fromId, currency: debt.currency, amount: -debt.amount }));
    },
  };
}
