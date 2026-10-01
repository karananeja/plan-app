import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { createTestDb } from "./test/db.ts";

describe("GET /api/health", () => {
  it("reports the API and its migrated database as ok", async () => {
    const app = createApp({ db: createTestDb() });

    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", db: "ok" });
  });
});
