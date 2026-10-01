import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { FormError } from "@/components/auth-card.tsx";
import { api } from "@/lib/api.ts";
import { initials, useMe } from "@/lib/me.ts";

const CURRENCIES = Intl.supportedValuesOf("currency");

export function ProfilePage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: async (input: { name: string; currency: string }) => {
      const res = await api.me.$patch({ json: input });
      if (!res.ok) throw new Error("Please check the name and currency.");
    },
    onSuccess: () => {
      setSaved(true);
      return queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  if (!me.data) return null;
  const profile = me.data;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaved(false);
    save.mutate({ name: String(form.get("name")), currency: String(form.get("currency")) });
  }

  return (
    <Card className="max-w-md">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
          {initials(profile.name)}
        </div>
        <div>
          <CardTitle>{profile.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={profile.name} required maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Default currency</Label>
            <select
              id="currency"
              name="currency"
              defaultValue={profile.currency ?? "USD"}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Used for new Groups and Expenses.</p>
          </div>
          <FormError message={save.error?.message ?? null} />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={save.isPending}>Save</Button>
            {saved && <span className="text-sm text-muted-foreground">Saved</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
