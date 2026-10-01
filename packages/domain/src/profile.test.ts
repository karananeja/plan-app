import { describe, expect, it } from "vitest";
import { currencyForLocale } from "./index.ts";

describe("currencyForLocale", () => {
  it.each([
    ["en-IN", "INR"],
    ["en-US", "USD"],
    ["de-DE", "EUR"],
    ["en-GB", "GBP"],
    ["ja-JP", "JPY"],
    ["hi", "INR"],
  ])("%s → %s", (locale, currency) => {
    expect(currencyForLocale(locale)).toBe(currency);
  });

  it("falls back to USD for a locale without a known region", () => {
    expect(currencyForLocale("xx")).toBe("USD");
  });
});
