import type { Browser } from "./groups.ts";
import { json } from "./groups.ts";

export type Effect = { kind: "lent" | "owe" | "none"; amountMinor: number };
export type ExpenseSummary = {
  id: string; description: string; date: string; category: string; currency: string; totalMinor: number;
  payer: { personId: string; name: string }; myEffect: Effect;
};
export type ExpenseDetail = ExpenseSummary & {
  groupId: string | null; method: string; note: string | null;
  shares: { personId: string; name: string; shareMinor: number }[];
};

export const addGroupExpense = (b: Browser, groupId: string, body: object) =>
  b.post(`/api/groups/${groupId}/expenses`, {
    date: "2026-09-28", category: "food", method: "equal", ...body,
  });
export const groupExpenses = async (b: Browser, groupId: string) =>
  (await json<{ expenses: ExpenseSummary[] }>(b.get(`/api/groups/${groupId}/expenses`))).expenses;
export const getExpense = (b: Browser, id: string) => json<ExpenseDetail>(b.get(`/api/expenses/${id}`));
