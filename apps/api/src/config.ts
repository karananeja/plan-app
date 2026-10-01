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
