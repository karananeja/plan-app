import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useNavigate } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { authClient } from "@/lib/auth-client.ts";
import { initials, useMe } from "@/lib/me.ts";

/** Layout for signed-in pages. Signed-out visitors are sent to sign-in. */
export function AppShell() {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resent, setResent] = useState(false);

  if (me.isPending) return null;
  if (me.isError) return <p className="p-8 text-destructive">{me.error.message}</p>;
  if (!me.data) return <Navigate to="/sign-in" replace />;
  const profile = me.data;

  async function signOut() {
    await authClient.signOut();
    queryClient.clear();
    navigate("/sign-in");
  }

  async function resend() {
    await authClient.sendVerificationEmail({ email: profile.email, callbackURL: "/" });
    setResent(true);
  }

  const nav = ({ isActive }: { isActive: boolean }) => (isActive ? "font-medium" : "text-muted-foreground hover:text-foreground");

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
          <Link to="/" className="font-semibold">Plan App</Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" end className={nav}>Home</NavLink>
            <NavLink to="/groups" className={nav}>Groups</NavLink>
            <NavLink to="/friends" className={nav}>Friends</NavLink>
            <NavLink to="/profile" className={nav}>Profile</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground" title={profile.name}>
              {initials(profile.name)}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {profile.inviteWaiting ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <h1 className="text-xl font-semibold">Verify your email to continue</h1>
            <p className="mt-2 text-muted-foreground">
              Your friends have already added you. Once you verify {profile.email}, everything they've shared with you
              will be here. (Running locally? The link is in the API console.)
            </p>
            <Button className="mt-4" variant="outline" onClick={resend} disabled={resent}>
              {resent ? "Sent again" : "Resend verification link"}
            </Button>
          </div>
        ) : (
          <>
            {!profile.emailVerified && (
              <Alert className="mb-6">
                <AlertDescription className="flex flex-wrap items-center gap-2">
                  Please verify {profile.email}: the link is in your email (running locally? check the API console).
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={resend} disabled={resent}>
                    {resent ? "Sent again" : "Resend link"}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <Outlet />
          </>
        )}
      </div>
    </div>
  );
}
