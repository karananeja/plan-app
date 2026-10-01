import { formatMoney } from "@plan-app/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/auth-card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { api } from "@/lib/api.ts";
import { initials } from "@/lib/me.ts";

type CurrencyAmount = { currency: string; amount: number };

function BalanceText({ balances }: { balances: CurrencyAmount[] }) {
  if (balances.length === 0) return <span className="text-sm text-muted-foreground">Settled up</span>;
  return (
    <span className="text-right text-sm">
      {balances.map(({ currency, amount }) => (
        <span key={currency} className={amount > 0 ? "block text-emerald-600" : "block text-orange-600"}>
          {amount > 0 ? "owes you " : "you owe "}
          {formatMoney(Math.abs(amount), currency)}
        </span>
      ))}
    </span>
  );
}

export function FriendsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const friends = useQuery({
    queryKey: ["friends", q],
    queryFn: async () => (await (await api.friends.$get({ query: { q } })).json()).friends,
  });
  const add = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.friends.$post({ json: { email } });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Please enter a valid email address.");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email"));
    add.mutate(email, { onSuccess: () => form.reset() });
  }

  return (
    <div className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold">Friends</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a friend</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="flex gap-2">
            <Input name="email" type="email" placeholder="friend@example.com" required aria-label="Friend's email" />
            <Button type="submit" disabled={add.isPending}>Add</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Not on Plan App yet? We'll send them an invite.</p>
          <FormError message={add.error?.message ?? null} />
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search friends" aria-label="Search friends" />
        {friends.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{q ? "No friends match." : "No friends yet. Add someone above."}</p>
        )}
        <ul className="divide-y rounded-md border">
          {friends.data?.map((f) => (
            <li key={f.personId} className="flex items-center gap-3 p-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {initials(f.invited ? f.email : f.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {f.name} {f.invited && <Badge variant="secondary" className="ml-1">Invited</Badge>}
                </p>
                {!f.invited && <p className="truncate text-sm text-muted-foreground">{f.email}</p>}
              </div>
              <BalanceText balances={f.netBalances} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
