import { expect } from "vitest";
import type { browser } from "./app.ts";

export type Browser = ReturnType<typeof browser>;
export type GroupSummary = {
  id: string; name: string; type: string; emoji: string; colour: string; currency: string; memberCount: number; archived: boolean;
};
export type GroupDetail = GroupSummary & {
  createdById: string;
  members: { personId: string; name: string; email: string; invited: boolean; groupBalances: { currency: string; amount: number }[] }[];
};

export async function json<T>(res: Promise<Response>, status = 200): Promise<T> {
  const r = await res;
  expect(r.status).toBe(status);
  return (await r.json()) as T;
}
export const createGroup = (b: Browser, body: object) => json<{ id: string }>(b.post("/api/groups", body));
export const listGroups = async (b: Browser) => (await json<{ groups: GroupSummary[] }>(b.get("/api/groups"))).groups;
export const getGroup = (b: Browser, id: string) => json<GroupDetail>(b.get(`/api/groups/${id}`));
export const personId = async (b: Browser) => (await json<{ person: { id: string } }>(b.get("/api/me"))).person.id;
export const friendEmails = async (b: Browser) =>
  (await json<{ friends: { email: string }[] }>(b.get("/api/friends"))).friends.map((f) => f.email).sort();
