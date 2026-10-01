import { GROUP_COLOURS, type GroupColour } from "@plan-app/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/auth-card.tsx";
import { GroupIcon } from "@/components/group-icon.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { api } from "@/lib/api.ts";
import { groupColourClass } from "@/lib/groups.ts";

type Editable = { id: string; name: string; emoji: string; colour: string; currency: string };

export function EditGroupDialog({ group }: { group: Editable }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState(group.emoji);
  const [colour, setColour] = useState(group.colour as GroupColour);
  const save = useMutation({
    mutationFn: async (json: { name: string; emoji: string; colour: GroupColour; currency: string }) => {
      const res = await api.groups[":id"].$patch({ param: { id: group.id }, json });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Please check the name and currency.");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      setOpen(false);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      name: String(form.get("name")),
      emoji: emoji || group.emoji,
      colour,
      currency: String(form.get("currency")).trim().toUpperCase(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit group</DialogTitle>
        </DialogHeader>
        <form id="edit-group" onSubmit={onSubmit} className="grid gap-4">
          <div className="flex items-end gap-3">
            <GroupIcon emoji={emoji || group.emoji} colour={colour} className="size-12 text-2xl" />
            <div className="grid flex-1 gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" name="name" defaultValue={group.name} required maxLength={60} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-emoji">Emoji</Label>
              <Input id="edit-emoji" className="w-16 text-center" maxLength={8} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </div>
          </div>
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
            <Label htmlFor="edit-currency">Currency</Label>
            <Input id="edit-currency" name="currency" className="w-24 uppercase" required pattern="[A-Za-z]{3}" defaultValue={group.currency} />
          </div>
          <FormError message={save.error?.message ?? null} />
        </form>
        <DialogFooter>
          <Button type="submit" form="edit-group" disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
