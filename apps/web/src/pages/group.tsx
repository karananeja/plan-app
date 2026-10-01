import { formatMoney } from "@plan-app/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { BalanceText } from "@/components/balance-text.tsx";
import { AddExpenseDialog } from "@/components/add-expense-dialog.tsx";
import { EditGroupDialog } from "@/components/edit-group-dialog.tsx";
import { EffectText } from "@/components/effect-text.tsx";
import { GroupIcon } from "@/components/group-icon.tsx";
import { FormError } from "@/components/auth-card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { api } from "@/lib/api.ts";
import { formatBillDate } from "@/lib/expenses.ts";
import { initials, useMe } from "@/lib/me.ts";

export function GroupPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const expenses = useQuery({
    queryKey: ["groups", id, "expenses"],
    queryFn: async () => {
      const res = await api.groups[":id"].expenses.$get({ param: { id } });
      return res.ok ? (await res.json()).expenses : [];
    },
  });
  const navigate = useNavigate();
  const me = useMe();
  const action = useMutation({
    mutationFn: async (kind: "archive" | "unarchive" | "delete" | "leave" | { remove: string }) => {
      const target = api.groups[":id"];
      const res =
        typeof kind === "object"
          ? await target.members[":personId"].$delete({ param: { id, personId: kind.remove } })
          : kind === "delete"
            ? await target.$delete({ param: { id } })
            : kind === "leave"
              ? await target.leave.$post({ param: { id } })
              : kind === "archive"
                ? await target.archive.$post({ param: { id } })
                : await target.unarchive.$post({ param: { id } });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "That didn't work. Please try again.");
      }
      return kind;
    },
    onSuccess: async (kind) => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (kind === "delete" || kind === "leave") navigate("/groups");
    },
  });
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
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">
            {g.name} {g.archived && <Badge variant="secondary" className="ml-1 align-middle">Archived</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">
            {g.memberCount} members · {g.currency}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {g.archived ? (
            <Button variant="outline" size="sm" onClick={() => action.mutate("unarchive")} disabled={action.isPending}>Un-archive</Button>
          ) : (
            <>
              <EditGroupDialog group={g} />
              <Button variant="outline" size="sm" onClick={() => action.mutate("archive")} disabled={action.isPending}>Archive</Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={action.isPending}
            onClick={() => window.confirm(`Leave "${g.name}"?`) && action.mutate("leave")}
          >
            Leave
          </Button>
          {me.data?.person?.id === g.createdById && (
            <Button
              variant="destructive"
              size="sm"
              disabled={action.isPending}
              onClick={() => window.confirm(`Delete "${g.name}" for everyone? This can't be undone.`) && action.mutate("delete")}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <FormError message={action.error?.message ?? null} />
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
              {m.personId !== me.data?.person?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${m.invited ? m.email : m.name}`}
                  disabled={action.isPending}
                  onClick={() => window.confirm(`Remove ${m.invited ? m.email : m.name} from "${g.name}"?`) && action.mutate({ remove: m.personId })}
                >
                  Remove
                </Button>
              )}
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
      <section className="grid gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Expenses</h2>
          {me.data?.person && <AddExpenseDialog groupId={g.id} currency={g.currency} members={g.members} meId={me.data.person.id} />}
        </div>
        {expenses.data?.length === 0 && <p className="text-sm text-muted-foreground">No expenses yet.</p>}
        <ul className="divide-y rounded-md border">
          {expenses.data?.map((e) => (
            <li key={e.id}>
              <Link to={`/expenses/${e.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{formatBillDate(e.date)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.payer.personId === me.data?.person?.id ? "You" : e.payer.name} paid {formatMoney(e.totalMinor, e.currency)}
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
