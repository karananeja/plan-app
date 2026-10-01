import type { Browser } from "./groups.ts";
import { json } from "./groups.ts";

export type Effect = { kind: "lent" | "owe" | "none"; amountMinor: number };
export type ExpenseSummary = {
  id: string; description: string; date: string; category: string; currency: string; totalMinor: number;
  payer: { personId: string; name: string }; myEffect: Effect;
};
export type ExpenseDetail = ExpenseSummary & {
  groupId: string | null; method: string; note: string | null; version: number;
  shares: { personId: string; name: string; shareMinor: number; input: string | null }[];
};

/** Posts a Group Expense. `participantIds` is shorthand for equal-split `participants`. */
export const addGroupExpense = (b: Browser, groupId: string, body: { participantIds?: string[] } & Record<string, unknown>) => {
  const { participantIds, ...rest } = body;
  return b.post(`/api/groups/${groupId}/expenses`, {
    date: "2026-09-28",
    category: "food",
    method: "equal",
    ...(participantIds ? { participants: participantIds.map((personId) => ({ personId })) } : {}),
    ...rest,
  });
};
export const groupExpenses = async (b: Browser, groupId: string) =>
  (await json<{ expenses: ExpenseSummary[] }>(b.get(`/api/groups/${groupId}/expenses`))).expenses;
export const getExpense = (b: Browser, id: string) => json<ExpenseDetail>(b.get(`/api/expenses/${id}`));

export const addExpense = (b: Browser, body: Record<string, unknown>) =>
  b.post("/api/expenses", { date: "2026-09-28", category: "food", method: "equal", ...body });

export type FriendPage = {
  personId: string; name: string; email: string; invited: boolean;
  netBalances: { currency: string; amount: number }[];
  expenses: ExpenseSummary[];
};
export const friendPage = (b: Browser, personId: string) => json<FriendPage>(b.get(`/api/friends/${personId}`));
