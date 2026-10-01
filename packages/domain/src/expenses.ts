import { z } from "zod";
import { currencyCode } from "./profile.ts";

export const EXPENSE_CATEGORIES = ["food", "travel", "rent", "utilities", "entertainment", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const splitValue = z.string().trim().optional();

/** Fields every Expense has, wherever it's recorded. */
const expenseFields = {
  description: z.string().trim().min(1).max(100),
  /** As typed, e.g. "1200.50"; converted to minor units in the Expense's currency. */
  amount: z.string().trim().regex(/^\d+(\.\d+)?$/, "Enter an amount like 1200 or 1200.50"),
  /** The calendar date on the bill. */
  date: z.iso.date(),
  category: z.enum(EXPENSE_CATEGORIES).default("other"),
  note: z.string().trim().max(500).optional(),
  payerId: z.string().min(1),
  method: z.enum(["equal", "exact", "percentage", "shares"]).default("equal"),
};

/**
 * A Group Expense: everyone is a Group Member, referenced by Person id.
 * `value` is what was typed, read by method: exact → an amount ("70.50"),
 * percentage → a percent ("33.33"), shares → whole Share Units ("2"). Ignored for equal.
 */
export const createExpenseInput = z.object({
  ...expenseFields,
  participants: z.array(z.object({ personId: z.string().min(1), value: splitValue })).max(50),
});
export type CreateExpenseInput = z.infer<typeof createExpenseInput>;

/**
 * A non-group Expense: Participants are me or my Friends (by Person id) or new people
 * (by email, who get invited). The currency defaults to my profile currency.
 */
export const createNonGroupExpenseInput = z.object({
  ...expenseFields,
  currency: currencyCode.optional(),
  participants: z
    .array(
      z.union([
        z.object({ personId: z.string().min(1), value: splitValue }),
        z.object({ email: z.string().trim().email(), value: splitValue }),
      ]),
    )
    .max(50),
});
export type CreateNonGroupExpenseInput = z.infer<typeof createNonGroupExpenseInput>;
