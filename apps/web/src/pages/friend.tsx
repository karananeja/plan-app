import { formatMoney } from "@plan-app/domain";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { AddExpenseDialog } from "@/components/add-expense-dialog.tsx";
import { BalanceText } from "@/components/balance-text.tsx";
import { EffectText } from "@/components/effect-text.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { api } from "@/lib/api.ts";
import { formatBillDate } from "@/lib/expenses.ts";
import { initials, useMe } from "@/lib/me.ts";

export function FriendPage() {
  const { personId = "" } = useParams();
  const me = useMe();
  const friend = useQuery({
    queryKey: ["friends", "page", personId],
    queryFn: async () => {
      const res = await api.friends[":personId"].$get({ param: { personId } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Could not load your friend");
      return res.json();
    },
  });

  if (friend.isPending) return null;
  if (!friend.data) {
    return (
      <p className="text-muted-foreground">
        Friend not found. <Link to="/friends" className="underline">Back to friends</Link>
      </p>
    );
  }
  const f = friend.data;
  const myPerson = me.data?.person;
  const displayName = f.invited ? f.email : f.name;

  return (
    <div className="grid max-w-2xl gap-6">
      <Link to="/friends" className="text-sm text-muted-foreground underline">← Friends</Link>
      <div className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-medium">{initials(displayName)}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">
            {displayName} {f.invited && <Badge variant="secondary" className="ml-1 align-middle">Invited</Badge>}
          </h1>
          {!f.invited && <p className="text-sm text-muted-foreground">{f.email}</p>}
          <div className="mt-1">
            <BalanceText balances={f.netBalances} />
          </div>
        </div>
        {myPerson && (
          <AddExpenseDialog
            target={{ friends: true }}
            currency={me.data?.currency ?? "USD"}
            meId={myPerson.id}
            members={[
              { personId: myPerson.id, name: me.data!.name, email: me.data!.email, invited: false },
              { personId: f.personId, name: f.name, email: f.email, invited: f.invited },
            ]}
          />
        )}
      </div>
      <section className="grid gap-2">
        <h2 className="font-medium">Expenses outside groups</h2>
        {f.expenses.length === 0 && <p className="text-sm text-muted-foreground">Nothing shared outside groups yet.</p>}
        <ul className="divide-y rounded-md border">
          {f.expenses.map((e) => (
            <li key={e.id}>
              <Link to={`/expenses/${e.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{formatBillDate(e.date)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.payer.personId === myPerson?.id ? "You" : e.payer.name} paid {formatMoney(e.totalMinor, e.currency)}
                  </p>
                </div>
                <EffectText effect={e.myEffect} currency={e.currency} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
