import { formatMoney } from "@plan-app/domain";

type CurrencyAmount = { currency: string; amount: number };

/** Per-currency balance from my point of view: positive means they owe me. */
export function BalanceText({ balances, owedLabel = "owes you", oweLabel = "you owe" }: { balances: CurrencyAmount[]; owedLabel?: string; oweLabel?: string }) {
  if (balances.length === 0) return <span className="text-sm text-muted-foreground">Settled up</span>;
  return (
    <span className="text-right text-sm">
      {balances.map(({ currency, amount }) => (
        <span key={currency} className={amount > 0 ? "block text-emerald-600 dark:text-emerald-400" : "block text-orange-600 dark:text-orange-400"}>
          {amount > 0 ? owedLabel : oweLabel} {formatMoney(Math.abs(amount), currency)}
        </span>
      ))}
    </span>
  );
}
