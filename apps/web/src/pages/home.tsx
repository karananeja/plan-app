import { useMe } from "@/lib/me.ts";

export function HomePage() {
  const me = useMe();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Hi {me.data?.name.split(" ")[0]}</h1>
      <p className="mt-2 text-muted-foreground">Friends and Groups are coming next.</p>
    </div>
  );
}
