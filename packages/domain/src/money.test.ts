import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits } from "./index.ts";

describe("money", () => {
  it("converts an amount typed by a user into integer minor units", () => {
    expect(toMinorUnits("12.34", "INR")).toBe(1234);
  });

  it("formats integer minor units for display", () => {
    expect(formatMoney(1234, "INR")).toBe("₹12.34");
  });
});
