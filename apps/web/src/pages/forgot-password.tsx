import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { AuthCard, FormError } from "@/components/auth-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { authClient } from "@/lib/auth-client.ts";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    if (error) return setError(error.message ?? "Could not send the reset link");
    setSent(true);
  }

  return (
    <AuthCard title="Forgot your password?" description="We'll email you a link to choose a new one.">
      {sent ? (
        <p className="text-sm">
          If that email has an account, a reset link is on its way. (Running locally? It's printed in the API console.)
        </p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <FormError message={error} />
          <Button type="submit">Send reset link</Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm"><Link to="/sign-in" className="underline">Back to sign in</Link></p>
    </AuthCard>
  );
}
