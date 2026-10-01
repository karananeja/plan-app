import { formatMoney } from "@plan-app/domain";

type Effect = { kind: "lent" | "owe" | "none"; amountMinor: number };

/** What an Expense means for me: "you lent ₹900", "you owe ₹300", or "not involved". */
export function EffectText({ effect, currency }: { effect: Effect; currency: string }) {
  if (effect.kind === "none") return <span className="text-sm text-muted-foreground">not involved</span>;
  const lent = effect.kind === "lent";
  return (
    <span className={`text-right text-sm ${lent ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
      <span className="block text-xs text-muted-foreground">{lent ? "you lent" : "you owe"}</span>
      {formatMoney(effect.amountMinor, currency)}
    </span>
  );
}
