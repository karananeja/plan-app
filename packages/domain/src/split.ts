export type SplitMethod = "equal" | "exact" | "percentage" | "shares";

export type SplitInput = {
  /** Expense total in integer minor units. */
  totalMinor: number;
  method: SplitMethod;
  /**
   * In entry order. `value` depends on the method: exact → minor units, percentage → basis points
   * (33.33% = 3333), shares → Share Units. Ignored for equal.
   */
  participants: { personId: string; value?: number }[];
};

export type SplitResult =
  | { ok: true; shares: { personId: string; shareMinor: number }[]; remaining: 0 }
  | { ok: false; error: { code: string; message: string }; remaining?: number };

/**
 * Divides `total` in proportion to `weights` using exact integer arithmetic: each Share is floored,
 * then leftover minor units go one at a time to the largest fractional remainders, ties broken by
 * entry order. The result always sums to `total`. (BigInt avoids overflow on total × weight.)
 */
function allocate(total: number, weights: number[]): number[] {
  const sum = BigInt(weights.reduce((a, b) => a + b, 0));
  const exact = weights.map((w) => BigInt(total) * BigInt(w));
  const floors = exact.map((e) => e / sum);
  let leftover = BigInt(total) - floors.reduce((a, b) => a + b, 0n);
  const byRemainder = exact
    .map((e, i) => ({ i, r: e % sum }))
    .sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));
  for (const { i } of byRemainder) {
    if (leftover === 0n) break;
    floors[i]! += 1n;
    leftover -= 1n;
  }
  return floors.map(Number);
}

const FULL_PERCENT = 10000; // 100.00% in basis points

function fail(code: string, message: string, remaining?: number): SplitResult {
  return remaining === undefined ? { ok: false, error: { code, message } } : { ok: false, error: { code, message }, remaining };
}

/** Why the input can't be split, or null if it can. */
function validate({ totalMinor, method, participants }: SplitInput): SplitResult | null {
  if (participants.length === 0) return fail("no-participants", "Choose at least one person to split with.");
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) return fail("invalid-total", "Enter an amount greater than zero.");
  if (new Set(participants.map((p) => p.personId)).size !== participants.length) {
    return fail("duplicate-participant", "Each person can only be in the split once.");
  }
  if (method === "equal") return null;

  const values = participants.map((p) => p.value);
  const valid = (v: number | undefined): v is number =>
    v !== undefined && Number.isSafeInteger(v) && (method === "shares" ? v > 0 : v >= 0);
  if (!values.every(valid)) {
    const what = { exact: "an amount of zero or more", percentage: "a percentage of zero or more", shares: "a whole number of shares, 1 or more" }[method];
    return fail("invalid-value", `Give everyone ${what}.`);
  }
  const sum = values.reduce((a, b) => a + b, 0);
  if (method === "exact" && sum !== totalMinor) {
    return fail("exact-mismatch", "The amounts must add up to the total.", totalMinor - sum);
  }
  if (method === "percentage" && sum !== FULL_PERCENT) {
    return fail("percentage-mismatch", "The percentages must add up to 100%.", FULL_PERCENT - sum);
  }
  return null;
}

/** Turns an Expense total and a Split into each Participant's Share (see GLOSSARY: Split, Share). */
export function splitExpense(input: SplitInput): SplitResult {
  const invalid = validate(input);
  if (invalid) return invalid;
  const weights = input.participants.map((p) => (input.method === "equal" ? 1 : (p.value ?? 0)));
  const amounts = allocate(input.totalMinor, weights);
  return {
    ok: true,
    shares: input.participants.map((p, i) => ({ personId: p.personId, shareMinor: amounts[i]! })),
    remaining: 0,
  };
}
