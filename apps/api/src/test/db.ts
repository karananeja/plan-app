import { openDb } from "../db/client.ts";

/** A fresh, fully migrated in-memory database. Call once per test. */
export function createTestDb() {
  return openDb(":memory:");
}
