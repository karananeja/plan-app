import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { AuthCard, FormError } from "@/components/auth-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { authClient } from "@/lib/auth-client.ts";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") ? "This reset link is invalid or has expired." : null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const newPassword = String(new FormData(e.currentTarget).get("password"));
    const { error } = await authClient.resetPassword({ newPassword, token });
    if (error) return setError(error.message ?? "Could not reset the password");
    setDone(true);
  }

  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <p className="text-sm">Password updated. <Link to="/sign-in" className="underline">Sign in</Link></p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" disabled={!token} />
          </div>
          <FormError message={error ?? (token ? null : "This page needs the link from your reset email.")} />
          <Button type="submit" disabled={!token}>Set password</Button>
        </form>
      )}
    </AuthCard>
  );
}
