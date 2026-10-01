import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { BalanceText } from "@/components/balance-text.tsx";
import { GroupIcon } from "@/components/group-icon.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { api } from "@/lib/api.ts";
import { initials } from "@/lib/me.ts";

export function GroupPage() {
  const { id = "" } = useParams();
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
      </section>
      <p className="text-sm text-muted-foreground">Expenses are coming next.</p>
    </div>
  );
}
