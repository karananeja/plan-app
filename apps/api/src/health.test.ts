import { describe, expect, it } from "vitest";
import { createTestApp } from "./test/app.ts";

describe("GET /api/health", () => {
  it("reports the API and its migrated database as ok", async () => {
    const { app } = createTestApp();

    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", db: "ok" });
  });
});
