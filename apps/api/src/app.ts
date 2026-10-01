import { zValidator } from "@hono/zod-validator";
import { updateProfileInput } from "@plan-app/domain";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createAuth, type AuthConfig } from "./auth.ts";
import type { Db } from "./db/client.ts";
import { person, user } from "./db/schema.ts";
import type { EmailSender } from "./email.ts";

export type AppDeps = { db: Db; email: EmailSender; auth: AuthConfig };

export function createApp({ db, email, auth: authConfig }: AppDeps) {
  const auth = createAuth({ db, email, config: authConfig });

  return new Hono()
    .basePath("/api")
    .get("/health", (c) => {
      db.get(sql`select 1`);
      return c.json({ status: "ok", db: "ok" } as const);
    })
    .on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw))
    .get("/me", async (c) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (!session) return c.json({ error: "Not signed in" }, 401);
      const { user } = session;
      const me = db.select().from(person).where(eq(person.userId, user.id)).get();
      return c.json({
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        currency: user.currency ?? null,
        person: me ? { id: me.id, status: me.status } : null,
      });
    })
    .patch("/me", zValidator("json", updateProfileInput), async (c) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (!session) return c.json({ error: "Not signed in" }, 401);
      const { name, currency } = c.req.valid("json");
      db.transaction((tx) => {
        tx.update(user)
          .set({ ...(name && { name }), ...(currency && { currency }), updatedAt: new Date() })
          .where(eq(user.id, session.user.id))
          .run();
        if (name) tx.update(person).set({ name }).where(eq(person.userId, session.user.id)).run();
      });
      return c.json({ ok: true } as const);
    });
}

/** Route types for the web app's typed RPC client. */
export type AppType = ReturnType<typeof createApp>;
