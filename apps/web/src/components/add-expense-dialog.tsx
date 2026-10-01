import {
  EXPENSE_CATEGORIES,
  describeRemaining,
  formatMoney,
  parseSplitValue,
  splitExpense,
  toMinorUnits,
  type ExpenseCategory,
  type SplitMethod,
} from "@plan-app/domain";
import { cn } from "cn";
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
const METHODS: { method: SplitMethod; label: string; hint: string; suffix?: string }[] = [
  { method: "equal", label: "Equally", hint: "Tick who shares it." },
  { method: "exact", label: "Amounts", hint: "Enter what each person owes. Leave blank to leave someone out." },
  { method: "percentage", label: "Percent", hint: "Percentages must total 100%. Leave blank to leave someone out.", suffix: "%" },
  { method: "shares", label: "Shares", hint: "e.g. 2 for someone who had two portions. Leave blank to leave someone out." },
];

const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export function AddExpenseDialog({ groupId, currency, members, meId }: { groupId: string; currency: string; members: Member[]; meId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(meId);
  const [included, setIncluded] = useState<Set<string>>(() => new Set(members.map((m) => m.personId)));
  const [method, setMethod] = useState<SplitMethod>("equal");
  const [values, setValues] = useState<Record<string, string>>({});
  const label = (m: Member) => (m.personId === meId ? "You" : m.invited ? m.email : m.name);

  /** Who's in the split, with what they typed: ticked people for equal, non-blank values otherwise. */
  const participants = useMemo(
    (): { personId: string; value?: string }[] =>
      method === "equal"
        ? members.filter((m) => included.has(m.personId)).map((m) => ({ personId: m.personId }))
        : members.filter((m) => values[m.personId]?.trim()).map((m) => ({ personId: m.personId, value: values[m.personId]!.trim() })),
    [method, members, included, values],
  );

  const preview = useMemo((): { shares?: Map<string, number>; error?: string | null } => {
    let totalMinor: number;
    let parsed: { personId: string; value?: number }[];
    try {
      totalMinor = toMinorUnits(amount || "0", currency);
      parsed = participants.map((p) => ({ personId: p.personId, value: parseSplitValue(method, p.value, currency) }));
    } catch (e) {
      return { error: (e as Error).message };
    }
    const r = splitExpense({ totalMinor, method, participants: parsed });
    if (r.ok) return { shares: new Map(r.shares.map((s) => [s.personId, s.shareMinor])) };
    if (!amount) return { error: null };
    if (r.remaining !== undefined && (method === "exact" || method === "percentage")) {
      return { error: describeRemaining(method, r.remaining, currency) };
    }
    return { error: r.error.message };
  }, [amount, currency, method, participants]);

  const create = useMutation({
    mutationFn: async (json: {
      description: string; amount: string; date: string; category: ExpenseCategory; note?: string; payerId: string;
      method: SplitMethod; participants: { personId: string; value?: string }[];
    }) => {
      const res = await api.groups[":id"].expenses.$post({ param: { id: groupId }, json });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Please check the expense details.");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      setOpen(false);
      setAmount("");
      setValues({});
      setMethod("equal");
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
      method,
      participants,
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
            <Label>Split</Label>
            <div className="grid grid-cols-4 gap-1 rounded-md bg-muted p-1" role="tablist" aria-label="Split method">
              {METHODS.map((m) => (
                <button
                  key={m.method}
                  type="button"
                  role="tab"
                  aria-selected={m.method === method}
                  onClick={() => setMethod(m.method)}
                  className={cn("rounded px-2 py-1 text-sm", m.method === method ? "bg-background font-medium shadow-xs" : "text-muted-foreground")}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{METHODS.find((m) => m.method === method)!.hint}</p>
            <ul className="divide-y rounded-md border">
              {members.map((m) => {
                const share = preview.shares?.get(m.personId);
                const suffix = METHODS.find((x) => x.method === method)!.suffix;
                return (
                  <li key={m.personId} className="flex items-center gap-3 px-3 py-2 text-sm">
                    {method === "equal" ? (
                      <input
                        type="checkbox"
                        aria-label={`Include ${label(m)}`}
                        className="size-4 accent-primary"
                        checked={included.has(m.personId)}
                        onChange={() => toggle(m.personId)}
                      />
                    ) : null}
                    <span className="flex-1 truncate">{label(m)}</span>
                    {method !== "equal" && (
                      <span className="flex items-center gap-1">
                        <Input
                          aria-label={`${m.personId === meId ? "Your" : `${label(m)}'s`} ${method === "exact" ? "amount" : method === "percentage" ? "percent" : "shares"}`}
                          inputMode={method === "shares" ? "numeric" : "decimal"}
                          className="h-8 w-24 text-right"
                          value={values[m.personId] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [m.personId]: e.target.value }))}
                        />
                        {suffix && <span className="text-muted-foreground">{suffix}</span>}
                      </span>
                    )}
                    <span className="w-24 text-right tabular-nums text-muted-foreground">
                      {share !== undefined ? formatMoney(share, currency) : "—"}
                    </span>
                  </li>
                );
              })}
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
