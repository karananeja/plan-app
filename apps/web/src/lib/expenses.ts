import type { ExpenseCategory } from "@plan-app/domain";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "🍽️ Food",
  travel: "🚕 Travel",
  rent: "🏠 Rent",
  utilities: "💡 Utilities",
  entertainment: "🎟️ Entertainment",
  other: "🧾 Other",
};

/** Today's calendar date in the user's time zone, as YYYY-MM-DD. */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "28 Sep" for a YYYY-MM-DD calendar date, without shifting it through a time zone. */
export function formatBillDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
}
