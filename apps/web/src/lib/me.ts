import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api.ts";

/** The signed-in User's profile, or null when signed out. */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.me.$get();
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Could not load your profile");
      return res.json();
    },
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}
