import { z } from "zod";

export const EXPENSE_CATEGORIES = ["food", "travel", "rent", "utilities", "entertainment", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const createExpenseInput = z.object({
  description: z.string().trim().min(1).max(100),
  /** As typed, e.g. "1200.50"; converted to minor units in the Expense's currency. */
  amount: z.string().trim().regex(/^\d+(\.\d+)?$/, "Enter an amount like 1200 or 1200.50"),
  /** The calendar date on the bill. */
  date: z.iso.date(),
  category: z.enum(EXPENSE_CATEGORIES).default("other"),
  note: z.string().trim().max(500).optional(),
  payerId: z.string().min(1),
  method: z.literal("equal"),
  participantIds: z.array(z.string().min(1)).max(50),
});
export type CreateExpenseInput = z.infer<typeof createExpenseInput>;
