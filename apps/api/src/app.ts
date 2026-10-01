import { zValidator } from "@hono/zod-validator";
import { addFriendInput, addGroupMembersInput, createGroupInput, updateProfileInput } from "@plan-app/domain";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createAuth, type AuthConfig } from "./auth.ts";
import type { Db } from "./db/client.ts";
import { person, user } from "./db/schema.ts";
import type { EmailSender } from "./email.ts";
import { noTransactionsYet, type Balances } from "./balances/index.ts";
import { NotFoundError, RuleError } from "./errors.ts";
import { addGroupMembers, createGroup, getGroup, listGroups } from "./groups/service.ts";
import { addFriend, listFriends } from "./friends/service.ts";
import { invitedPersonFor } from "./people/index.ts";
import { createMiddleware } from "hono/factory";

export type AppDeps = { db: Db; email: EmailSender; auth: AuthConfig; balances?: Balances };

export function createApp({ db, email, auth: authConfig, balances = noTransactionsYet }: AppDeps) {
  const auth = createAuth({ db, email, config: authConfig });

  const groupsDeps = { db, balances, email, origin: authConfig.origin };

  /** Requires a session; makes the signed-in User's Person available as `me`. */
  const signedIn = createMiddleware<{ Variables: { me: typeof person.$inferSelect } }>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Not signed in" }, 401);
    const me = db.select().from(person).where(eq(person.userId, session.user.id)).get();
    if (!me) {
      return c.json({ error: "Verify your email to continue: your friends have already added you." }, 403);
    }
    c.set("me", me);
    await next();
  });

  return new Hono()
    .basePath("/api")
    .onError((err, c) => {
      if (err instanceof RuleError) return c.json({ error: err.message }, 400);
      if (err instanceof NotFoundError) return c.json({ error: err.message }, 404);
      throw err;
    })
    .get("/health", (c) => {
      db.get(sql`select 1`);
      return c.json({ status: "ok", db: "ok" } as const);
    })
    .get("/auth/options", (c) => c.json({ google: Boolean(authConfig.google) }))
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
        inviteWaiting: !me && Boolean(invitedPersonFor(db, user.email)),
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
    })
    .get("/friends", signedIn, (c) => c.json({ friends: listFriends({ db, balances }, c.var.me, c.req.query("q")) }))
    .post("/friends", signedIn, zValidator("json", addFriendInput), async (c) => {
      await addFriend({ db, email, origin: authConfig.origin }, c.var.me, c.req.valid("json").email);
      return c.json({ ok: true } as const);
    })
    .get("/groups", signedIn, (c) => c.json({ groups: listGroups(groupsDeps, c.var.me) }))
    .post("/groups", signedIn, zValidator("json", createGroupInput), async (c) =>
      c.json(await createGroup(groupsDeps, c.var.me, c.req.valid("json"))),
    )
    .get("/groups/:id", signedIn, (c) => c.json(getGroup(groupsDeps, c.var.me, c.req.param("id"))))
    .post("/groups/:id/members", signedIn, zValidator("json", addGroupMembersInput), async (c) => {
      await addGroupMembers(groupsDeps, c.var.me, c.req.param("id"), c.req.valid("json"));
      return c.json({ ok: true } as const);
    });
}

/** Route types for the web app's typed RPC client. */
export type AppType = ReturnType<typeof createApp>;
