import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "./db/client.ts";

export function createApp({ db }: { db: Db }) {
  return new Hono().basePath("/api").get("/health", (c) => {
    db.get(sql`select 1`);
    return c.json({ status: "ok", db: "ok" } as const);
  });
}

/** Route types for the web app's typed RPC client. */
export type AppType = ReturnType<typeof createApp>;
