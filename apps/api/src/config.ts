import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

/** SQLite file path, from DATABASE_PATH (relative paths resolve from the repo root). */
export function databasePath(): string {
  const path = process.env.DATABASE_PATH ?? "data/plan-app.sqlite";
  return path.startsWith("/") ? path : repoRoot + path;
}

export function apiPort(): number {
  return Number(process.env.API_PORT ?? 8787);
}

const DEV_SECRET = "dev-only-secret-change-me-in-env-file-0000";

/** Secret for signing sessions and tokens. A fixed dev value is used if unset (local only). */
export function authSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) console.warn("BETTER_AUTH_SECRET is not set; using an insecure development secret.");
  return secret ?? DEV_SECRET;
}

/** Origin the browser uses (the web app). Links in emails point here. */
export function webOrigin(): string {
  return process.env.WEB_ORIGIN ?? `http://localhost:${process.env.WEB_PORT ?? 5173}`;
}

/** Google OAuth client from GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET; undefined when either is missing. */
export function googleOAuth(): { clientId: string; clientSecret: string } | undefined {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}
