import { formatMoney } from "@plan-app/domain";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { EffectText } from "@/components/effect-text.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { api } from "@/lib/api.ts";
import { CATEGORY_LABELS, formatBillDate } from "@/lib/expenses.ts";
import { useMe } from "@/lib/me.ts";

const METHOD_LABELS: Record<string, string> = { equal: "Split equally", exact: "Exact amounts", percentage: "By percentage", shares: "By shares" };

export function ExpensePage() {
  const { id = "" } = useParams();
  const me = useMe();
  const expense = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await api.expenses[":id"].$get({ param: { id } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Could not load the expense");
      return res.json();
    },
  });

  if (expense.isPending) return null;
  if (!expense.data) return <p className="text-muted-foreground">Expense not found.</p>;
  const e = expense.data;
  const myId = me.data?.person?.id;

  return (
    <div className="grid max-w-xl gap-4">
      {e.groupId && <Link to={`/groups/${e.groupId}`} className="text-sm text-muted-foreground underline">← Back to group</Link>}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{e.description}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatBillDate(e.date)} · {CATEGORY_LABELS[e.category as keyof typeof CATEGORY_LABELS] ?? e.category}
            </p>
          </div>
          <EffectText effect={e.myEffect} currency={e.currency} />
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-3xl font-semibold tabular-nums">{formatMoney(e.totalMinor, e.currency)}</p>
          <p className="text-sm">
            Paid by <span className="font-medium">{e.payer.personId === myId ? "you" : e.payer.name}</span> · {METHOD_LABELS[e.method] ?? e.method}
          </p>
          <ul className="divide-y rounded-md border">
            {e.shares.map((s) => (
              <li key={s.personId} className="flex justify-between p-3 text-sm">
                <span>{s.personId === myId ? "You" : s.name}</span>
                <span className="tabular-nums">{formatMoney(s.shareMinor, e.currency)}</span>
              </li>
            ))}
          </ul>
          {e.note && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{e.note}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
