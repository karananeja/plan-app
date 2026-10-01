import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomUUID } from "node:crypto";
import type { Db } from "./db/client.ts";
import * as schema from "./db/schema.ts";
import type { EmailSender } from "./email.ts";

export type AuthConfig = {
  /** Signs session cookies and tokens. At least 32 characters. */
  secret: string;
  /** Origin the browser uses (the web app); links in emails point here. */
  origin: string;
  /** Google OAuth client. Without it, Google sign-in isn't offered. */
  google?: { clientId: string; clientSecret: string };
};

export function createAuth({ db, email, config }: { db: Db; email: EmailSender; config: AuthConfig }) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.origin,
    basePath: "/api/auth",
    trustedOrigins: [config.origin],
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    user: {
      additionalFields: {
        currency: { type: "string", required: false, input: true },
      },
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await email.send({
          to: user.email,
          subject: "Reset your password",
          text: `Hi ${user.name}, use this link to choose a new password.`,
          link: url,
        });
      },
    },
    socialProviders: config.google ? { google: config.google } : {},
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await email.send({
          to: user.email,
          subject: "Verify your email",
          text: `Hi ${user.name}, confirm this is your email address.`,
          link: url,
        });
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Every User is backed by an active Person (see GLOSSARY.md).
          after: async (user) => {
            db.insert(schema.person)
              .values({
                id: randomUUID(),
                userId: user.id,
                email: user.email,
                name: user.name,
                status: "active",
                createdAt: new Date(),
              })
              .run();
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
