import { describe, expect, it } from "vitest";
import { createTestApp, signedUp } from "./test/app.ts";

describe("error responses", () => {
  it("a malformed JSON body is a 400, not a server error", async () => {
    const { app } = createTestApp();
    const asha = await signedUp(app, "Asha");

    const res = await asha.postRaw("/api/groups", "{not json");

    expect(res.status).toBe(400);
  });
});
