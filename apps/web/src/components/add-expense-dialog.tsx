import { EXPENSE_CATEGORIES, splitExpense, toMinorUnits, formatMoney, type ExpenseCategory } from "@plan-app/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { FormError } from "@/components/auth-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { api } from "@/lib/api.ts";
import { CATEGORY_LABELS, todayLocal } from "@/lib/expenses.ts";

type Member = { personId: string; name: string; email: string; invited: boolean };
const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export function AddExpenseDialog({ groupId, currency, members, meId }: { groupId: string; currency: string; members: Member[]; meId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(meId);
  const [included, setIncluded] = useState<Set<string>>(() => new Set(members.map((m) => m.personId)));
  const label = (m: Member) => (m.personId === meId ? "You" : m.invited ? m.email : m.name);

  const preview = useMemo((): { shares?: Map<string, number>; error?: string | null } => {
    let totalMinor: number;
    try {
      totalMinor = toMinorUnits(amount || "0", currency);
    } catch (e) {
      return { error: (e as Error).message };
    }
    const participants = members.filter((m) => included.has(m.personId)).map((m) => ({ personId: m.personId }));
    const r = splitExpense({ totalMinor, method: "equal", participants });
    return r.ok ? { shares: new Map(r.shares.map((s) => [s.personId, s.shareMinor])) } : { error: amount ? r.error.message : null };
  }, [amount, currency, members, included]);

  const create = useMutation({
    mutationFn: async (json: { description: string; amount: string; date: string; category: ExpenseCategory; note?: string; payerId: string; participantIds: string[] }) => {
      const res = await api.groups[":id"].expenses.$post({ param: { id: groupId }, json: { ...json, method: "equal" } });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Please check the expense details.");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      setOpen(false);
      setAmount("");
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const note = String(form.get("note") ?? "").trim();
    create.mutate({
      description: String(form.get("description")),
      amount: amount.trim(),
      date: String(form.get("date")),
      category: String(form.get("category")) as ExpenseCategory,
      note: note || undefined,
      payerId,
      participantIds: members.filter((m) => included.has(m.personId)).map((m) => m.personId),
    });
  }

  function toggle(id: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add expense</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <form id="add-expense" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="exp-description">Description</Label>
            <Input id="exp-description" name="description" required maxLength={100} placeholder="Dinner at the beach shack" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="exp-amount">Amount ({currency})</Label>
              <Input id="exp-amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" name="date" type="date" required defaultValue={todayLocal()} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="exp-payer">Paid by</Label>
              <select id="exp-payer" className={selectClass} value={payerId} onChange={(e) => setPayerId(e.target.value)}>
                {members.map((m) => <option key={m.personId} value={m.personId}>{label(m)}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-category">Category</Label>
              <select id="exp-category" name="category" className={selectClass} defaultValue="food">
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Split equally between</Label>
            <ul className="divide-y rounded-md border">
              {members.map((m) => (
                <li key={m.personId}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={included.has(m.personId)} onChange={() => toggle(m.personId)} />
                    <span className="flex-1 truncate">{label(m)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {preview.shares?.has(m.personId) ? formatMoney(preview.shares.get(m.personId)!, currency) : "—"}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exp-note">Note (optional)</Label>
            <Textarea id="exp-note" name="note" maxLength={500} rows={2} />
          </div>
          <FormError message={create.error?.message ?? preview.error ?? null} />
        </form>
        <DialogFooter>
          <Button type="submit" form="add-expense" disabled={create.isPending || !preview.shares}>
            {create.isPending ? "Saving…" : "Save expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
