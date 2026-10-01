/** An amount in one currency, in integer minor units. Positive: the other person owes me. */
export type CurrencyAmount = { currency: string; amount: number };

/**
 * Where balance questions are answered (Spec 03). Callers never read the Ledger directly.
 * Balances in different currencies are never added together, so each answer is a list,
 * one entry per currency with a non-zero amount; an empty list means Settled Up.
 */
export interface Balances {
  /** Net Balance between `me` and `other`, from `me`'s point of view. */
  netBalances(me: string, other: string): CurrencyAmount[];
  /** A Group Member's Group Balance: positive means the Group owes them. */
  groupBalances(groupId: string, personId: string): CurrencyAmount[];
  /** Group Debts: who owes whom within a Group, netted per pair and currency (amount > 0). */
  groupDebts(groupId: string): GroupDebt[];
}

export type GroupDebt = { fromId: string; toId: string; currency: string; amount: number };

/** Until Spec 03 there are no Transactions, so every balance is Settled Up. */
export const noTransactionsYet: Balances = {
  netBalances: () => [],
  groupBalances: () => [],
  groupDebts: () => [],
};
