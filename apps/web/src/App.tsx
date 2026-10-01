import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button.tsx";
import { api } from "@/lib/api.ts";

export function App() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => (await api.health.$get()).json(),
  });

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Plan App</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        API: {health.isPending ? "…" : health.isError ? "unreachable" : health.data.status}
      </p>
      <Button className="mt-4" variant="outline" onClick={() => health.refetch()}>
        Check again
      </Button>
    </main>
  );
}
