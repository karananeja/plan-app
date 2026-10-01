import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button.tsx";
import { api } from "@/lib/api.ts";
import { authClient } from "@/lib/auth-client.ts";

/** "Continue with Google", shown only when the API has Google credentials configured. */
export function GoogleButton() {
  const options = useQuery({
    queryKey: ["auth-options"],
    queryFn: async () => (await api.auth.options.$get()).json(),
  });
  if (!options.data?.google) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/sign-in" })}
      >
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

const OAUTH_ERRORS: Record<string, string> = {
  account_not_linked:
    "An account with this email already exists but its email isn't verified. Sign in with your password and verify your email first, then you can use Google.",
};

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERRORS[code] ?? "Google sign-in didn't work. Please try again.";
}
