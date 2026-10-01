import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { splitExpense } from "./index.ts";

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ personId: `p${i + 1}` }));
const withValues = (...values: number[]) => values.map((value, i) => ({ personId: `p${i + 1}`, value }));
const sharesOf = (r: ReturnType<typeof splitExpense>) => (r.ok ? r.shares.map((s) => s.shareMinor) : r.error.code);

describe("splitExpense", () => {
  it("splits equally: $200 among 4 is $50 each", () => {
    expect(sharesOf(splitExpense({ totalMinor: 20000, method: "equal", participants: people(4) }))).toEqual([5000, 5000, 5000, 5000]);
  });

  it("hands leftover cents out in Participant order when remainders tie: ₹100 / 3", () => {
    expect(sharesOf(splitExpense({ totalMinor: 10000, method: "equal", participants: people(3) }))).toEqual([3334, 3333, 3333]);
    expect(sharesOf(splitExpense({ totalMinor: 10001, method: "equal", participants: people(3) }))).toEqual([3334, 3334, 3333]);
  });

  it("splits by Share Units: 2/1/1/1 of $200 is 80/40/40/40", () => {
    expect(sharesOf(splitExpense({ totalMinor: 20000, method: "shares", participants: withValues(2, 1, 1, 1) }))).toEqual([8000, 4000, 4000, 4000]);
  });

  it("gives the leftover to the largest remainder, not the first person: 1000 split 1:2 is 333/667", () => {
    expect(sharesOf(splitExpense({ totalMinor: 1000, method: "shares", participants: withValues(1, 2) }))).toEqual([333, 667]);
  });

  it("splits by Percentage (basis points): 40/20/20/20% of $200 is 80/40/40/40", () => {
    expect(sharesOf(splitExpense({ totalMinor: 20000, method: "percentage", participants: withValues(4000, 2000, 2000, 2000) }))).toEqual([8000, 4000, 4000, 4000]);
  });

  it("rounds percentages to whole minor units: 33.33/33.33/33.34% of ₹100.01", () => {
    expect(sharesOf(splitExpense({ totalMinor: 10001, method: "percentage", participants: withValues(3333, 3333, 3334) }))).toEqual([3333, 3333, 3335]);
  });

  it("uses Exact Amounts as given when they add up to the total: 70/50/50/30", () => {
    expect(sharesOf(splitExpense({ totalMinor: 20000, method: "exact", participants: withValues(7000, 5000, 5000, 3000) }))).toEqual([7000, 5000, 5000, 3000]);
  });

  describe("rejects invalid Splits with a reason", () => {
    it.each([
      ["no Participants", { totalMinor: 1000, method: "equal", participants: [] }, "no-participants"],
      ["a total of zero", { totalMinor: 0, method: "equal", participants: people(2) }, "invalid-total"],
      ["a negative total", { totalMinor: -500, method: "equal", participants: people(2) }, "invalid-total"],
      ["a fractional total", { totalMinor: 10.5, method: "equal", participants: people(2) }, "invalid-total"],
      ["the same person twice", { totalMinor: 1000, method: "equal", participants: [{ personId: "p1" }, { personId: "p1" }] }, "duplicate-participant"],
      ["zero Share Units", { totalMinor: 1000, method: "shares", participants: withValues(1, 0) }, "invalid-value"],
      ["fractional Share Units", { totalMinor: 1000, method: "shares", participants: withValues(1, 1.5) }, "invalid-value"],
      ["a negative percentage", { totalMinor: 1000, method: "percentage", participants: withValues(10500, -500) }, "invalid-value"],
      ["a negative exact amount", { totalMinor: 1000, method: "exact", participants: withValues(1500, -500) }, "invalid-value"],
      ["a missing value", { totalMinor: 1000, method: "exact", participants: [{ personId: "p1", value: 1000 }, { personId: "p2" }] }, "invalid-value"],
    ] as const)("%s", (_, input, code) => {
      expect(splitExpense(input as Parameters<typeof splitExpense>[0])).toMatchObject({ ok: false, error: { code } });
    });

    it("Exact Amounts that don't add up report what's left to assign (or over-assigned)", () => {
      expect(splitExpense({ totalMinor: 20000, method: "exact", participants: withValues(7000, 5000, 5000, 1000) })).toMatchObject({
        ok: false,
        error: { code: "exact-mismatch" },
        remaining: 2000,
      });
      expect(splitExpense({ totalMinor: 20000, method: "exact", participants: withValues(7000, 5000, 5000, 5000) })).toMatchObject({
        ok: false,
        remaining: -2000,
      });
    });

    it("Percentages must total exactly 100.00%: 99.99% and 100.01% both fail", () => {
      expect(splitExpense({ totalMinor: 1000, method: "percentage", participants: withValues(5000, 4999) })).toMatchObject({
        ok: false,
        error: { code: "percentage-mismatch" },
        remaining: 1,
      });
      expect(splitExpense({ totalMinor: 1000, method: "percentage", participants: withValues(5000, 5001) })).toMatchObject({
        ok: false,
        remaining: -1,
      });
    });
  });

  it("works in minor units only, so zero-decimal currencies need nothing special: ¥1000 / 3", () => {
    expect(sharesOf(splitExpense({ totalMinor: 1000, method: "equal", participants: people(3) }))).toEqual([334, 333, 333]);
  });

  it("property: any valid Split's Shares add up to the total exactly and are never negative", () => {
    const total = fc.integer({ min: 1, max: 10_000_000_00 });
    const count = fc.integer({ min: 1, max: 12 });
    /** n non-negative integers summing to `sum`. */
    const partition = (sum: number, n: number) =>
      fc.array(fc.integer({ min: 0, max: sum }), { minLength: n - 1, maxLength: n - 1 }).map((cuts) => {
        const sorted = [0, ...cuts.sort((a, b) => a - b), sum];
        return sorted.slice(1).map((c, i) => c - sorted[i]!);
      });
    const input = fc.oneof(
      fc.record({ totalMinor: total, n: count }).map(({ totalMinor, n }) => ({ totalMinor, method: "equal" as const, participants: people(n) })),
      fc.record({ totalMinor: total, units: fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 12 }) }).map(
        ({ totalMinor, units }) => ({ totalMinor, method: "shares" as const, participants: withValues(...units) }),
      ),
      fc.tuple(total, count).chain(([totalMinor, n]) =>
        partition(10000, n).map((bp) => ({ totalMinor, method: "percentage" as const, participants: withValues(...bp) })),
      ),
      fc.tuple(total, count).chain(([totalMinor, n]) =>
        partition(totalMinor, n).map((amounts) => ({ totalMinor, method: "exact" as const, participants: withValues(...amounts) })),
      ),
    );

    fc.assert(
      fc.property(input, (i) => {
        const r = splitExpense(i);
        if (!r.ok) return false;
        const shares = r.shares.map((s) => s.shareMinor);
        return shares.reduce((a, b) => a + b, 0) === i.totalMinor && shares.every((x) => x >= 0 && Number.isSafeInteger(x));
      }),
      { numRuns: 2000 },
    );
  });
});
