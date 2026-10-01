import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { BalanceText } from "@/components/balance-text.tsx";
import { GroupIcon } from "@/components/group-icon.tsx";
import { FormError } from "@/components/auth-card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { api } from "@/lib/api.ts";
import { initials } from "@/lib/me.ts";

export function GroupPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const addMembers = useMutation({
    mutationFn: async (emails: string[]) => {
      const res = await api.groups[":id"].members.$post({ param: { id }, json: { emails } });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Please enter valid email addresses.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const emails = String(new FormData(form).get("emails")).split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    if (emails.length) addMembers.mutate(emails, { onSuccess: () => form.reset() });
  }
  const group = useQuery({
    queryKey: ["groups", id],
    queryFn: async () => {
      const res = await api.groups[":id"].$get({ param: { id } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Could not load the group");
      return res.json();
    },
  });

  if (group.isPending) return null;
  if (!group.data) {
    return (
      <p className="text-muted-foreground">
        Group not found. <Link to="/groups" className="underline">Back to groups</Link>
      </p>
    );
  }
  const g = group.data;

  return (
    <div className="grid max-w-2xl gap-6">
      <div className="flex items-center gap-4">
        <GroupIcon emoji={g.emoji} colour={g.colour} className="size-14 text-3xl" />
        <div>
          <h1 className="text-2xl font-semibold">{g.name}</h1>
          <p className="text-sm text-muted-foreground">
            {g.memberCount} members · {g.currency}
          </p>
        </div>
      </div>
      <section className="grid gap-2">
        <h2 className="font-medium">Members</h2>
        <ul className="divide-y rounded-md border">
          {g.members.map((m) => (
            <li key={m.personId} className="flex items-center gap-3 p-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">{initials(m.invited ? m.email : m.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {m.invited ? m.email : m.name} {m.invited && <Badge variant="secondary" className="ml-1">Invited</Badge>}
                </p>
              </div>
              <BalanceText balances={m.groupBalances} owedLabel="gets back" oweLabel="owes" />
            </li>
          ))}
        </ul>
        {!g.archived && (
          <form onSubmit={onAdd} className="mt-2 flex gap-2">
            <Input name="emails" placeholder="Add people by email (comma separated)" aria-label="Add people by email" />
            <Button type="submit" variant="outline" disabled={addMembers.isPending}>Add</Button>
          </form>
        )}
        <FormError message={addMembers.error?.message ?? null} />
      </section>
      <p className="text-sm text-muted-foreground">Expenses are coming next.</p>
    </div>
  );
}
