import { DEFAULT_GROUP_EMOJI, GROUP_COLOURS, GROUP_TYPES, type GroupColour, type GroupType } from "@plan-app/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { FormError } from "@/components/auth-card.tsx";
import { GroupIcon } from "@/components/group-icon.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { api } from "@/lib/api.ts";
import { groupColourClass } from "@/lib/groups.ts";
import { useMe } from "@/lib/me.ts";

const TYPE_LABELS: Record<GroupType, string> = { trip: "Trip", home: "Home", couple: "Couple", other: "Other" };

export function NewGroupDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GroupType>("trip");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [colour, setColour] = useState<GroupColour>("teal");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [otherEmails, setOtherEmails] = useState("");
  const friends = useQuery({
    queryKey: ["friends", ""],
    queryFn: async () => (await (await api.friends.$get({ query: { q: "" } })).json()).friends,
    enabled: open,
  });
  const create = useMutation({
    mutationFn: async (json: { name: string; type: GroupType; emoji: string; colour: GroupColour; currency: string; memberEmails: string[] }) => {
      const res = await api.groups.$post({ json });
      if (!res.ok) throw new Error("Please check the name, currency and emails.");
      return res.json();
    },
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      setOpen(false);
      navigate(`/groups/${id}`);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const extra = otherEmails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    create.mutate({
      name: String(form.get("name")),
      type,
      emoji: emoji ?? DEFAULT_GROUP_EMOJI[type],
      colour,
      currency: String(form.get("currency")).trim().toUpperCase(),
      memberEmails: [...picked, ...extra],
    });
  }

  function toggle(email: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New group</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New group</DialogTitle>
        </DialogHeader>
        <form id="new-group" onSubmit={onSubmit} className="grid gap-4">
          <div className="flex items-end gap-3">
            <GroupIcon emoji={emoji ?? DEFAULT_GROUP_EMOJI[type]} colour={colour} className="size-12 text-2xl" />
            <div className="grid flex-1 gap-2">
              <Label htmlFor="group-name">Name</Label>
              <Input id="group-name" name="name" required maxLength={60} placeholder="Goa Trip" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_TYPES.map((t) => (
                <Button key={t} type="button" size="sm" variant={t === type ? "default" : "outline"} onClick={() => setType(t)}>
                  {DEFAULT_GROUP_EMOJI[t]} {TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="grid gap-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2">
                {GROUP_COLOURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={c === colour}
                    onClick={() => setColour(c)}
                    className={cn("size-7 rounded-full ring-offset-2 ring-offset-background", groupColourClass(c), c === colour && "ring-2 ring-ring")}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group-emoji">Emoji</Label>
              <Input id="group-emoji" className="w-16 text-center" maxLength={8} placeholder={DEFAULT_GROUP_EMOJI[type]} value={emoji ?? ""} onChange={(e) => setEmoji(e.target.value || null)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="group-currency">Currency</Label>
            <Input id="group-currency" name="currency" className="w-24 uppercase" required pattern="[A-Za-z]{3}" defaultValue={me.data?.currency ?? "USD"} />
          </div>
          <div className="grid gap-2">
            <Label>Members</Label>
            {friends.data?.length ? (
              <ul className="max-h-40 divide-y overflow-y-auto rounded-md border">
                {friends.data.map((f) => (
                  <li key={f.personId}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                      <input type="checkbox" checked={picked.has(f.email)} onChange={() => toggle(f.email)} className="size-4 accent-primary" />
                      <span className="flex-1 truncate">{f.invited ? f.email : f.name}</span>
                      {!f.invited && <span className="truncate text-muted-foreground">{f.email}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No friends yet. Add people by email below.</p>
            )}
            <Input aria-label="Other emails" placeholder="Other emails, comma separated" value={otherEmails} onChange={(e) => setOtherEmails(e.target.value)} />
            <p className="text-xs text-muted-foreground">Everyone in the group becomes friends. People not on Plan App get an invite.</p>
          </div>
          <FormError message={create.error?.message ?? null} />
        </form>
        <DialogFooter>
          <Button type="submit" form="new-group" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create group"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
