import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { GroupIcon } from "@/components/group-icon.tsx";
import { NewGroupDialog } from "@/components/new-group-dialog.tsx";
import { api } from "@/lib/api.ts";

export function GroupsPage() {
  const groups = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await (await api.groups.$get()).json()).groups,
  });

  return (
    <div className="grid max-w-2xl gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Groups</h1>
        <NewGroupDialog />
      </div>
      {groups.data?.length === 0 && <p className="text-sm text-muted-foreground">No groups yet. Create one for a trip, your flat, or anything you share.</p>}
      <GroupList groups={groups.data?.filter((g) => !g.archived) ?? []} />
      {groups.data?.some((g) => g.archived) && (
        <section className="grid gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Archived</h2>
          <GroupList groups={groups.data.filter((g) => g.archived)} />
        </section>
      )}
    </div>
  );
}

type GroupSummary = { id: string; name: string; emoji: string; colour: string; currency: string; memberCount: number };

function GroupList({ groups }: { groups: GroupSummary[] }) {
  if (groups.length === 0) return null;
  return (
    <ul className="divide-y rounded-md border">
      {groups.map((g) => (
        <li key={g.id}>
          <Link to={`/groups/${g.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
            <GroupIcon emoji={g.emoji} colour={g.colour} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{g.name}</p>
              <p className="text-sm text-muted-foreground">
                {g.memberCount} {g.memberCount === 1 ? "member" : "members"} · {g.currency}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
