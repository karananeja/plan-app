import { currencyForLocale } from "@plan-app/domain";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AuthCard, FormError } from "@/components/auth-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { authClient } from "@/lib/auth-client.ts";

export function SignUpPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      currency: currencyForLocale(navigator.language),
      callbackURL: "/",
    });
    setPending(false);
    if (error) return setError(error.message ?? "Could not sign up");
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    navigate("/");
  }

  return (
    <AuthCard title="Create your account" description="Split bills with friends without chasing anyone.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <FormError message={error} />
        <Button type="submit" disabled={pending}>{pending ? "Creating account…" : "Sign up"}</Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/sign-in" className="underline">Sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
