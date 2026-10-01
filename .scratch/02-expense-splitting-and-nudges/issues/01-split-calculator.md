# 01: Split calculator

**What to build:** The rule that turns an Expense total and a Split into each Participant's Share, as a pure domain function shared by the API and the Expense form's live preview. It supports all four Split methods (Equal, Exact Amounts, Percentage, Share Units), always produces Shares that add up to the total exactly, and explains what's wrong when the input is invalid. It has no I/O, so it's the most heavily tested piece of the app.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Equal, Exact Amounts, Percentage (input in basis points, e.g. 33.33% = 3333) and Share Units each produce Shares in integer minor units
- [x] Rounding: floor each exact Share, then give leftover minor units one at a time by largest fractional remainder, ties broken by Participant order (₹100 / 3 → 33.34 / 33.33 / 33.33)
- [x] The spec's worked example ($200 among 4) gives the expected Shares for every method
- [x] Validation errors (not exceptions): no Participants; total ≤ 0; Exact not summing to the total (reports the difference); Percentage not summing to 100.00% (reports the difference); Share Units not positive integers; duplicate Participants
- [x] Results also report "remaining to assign" so the form can show live feedback
- [x] Property test: for random valid inputs, Shares always sum to the total and are never negative
- [x] Works for zero-decimal currencies (JPY) as well as two-decimal ones

## Comments

- 2026-10-01: Done.
  - `splitExpense({ totalMinor, method, participants: [{ personId, value? }] })` returns `{ ok: true, shares, remaining: 0 }` or `{ ok: false, error: { code, message }, remaining? }`.
  - Codes: `no-participants`, `invalid-total`, `duplicate-participant`, `invalid-value`, `exact-mismatch`, `percentage-mismatch`. `remaining` is minor units (exact) or basis points (percentage); negative means over-assigned.
  - Messages don't include currency; the UI formats `remaining`.
  - Exact amounts and percentages of 0 are allowed. Share Units must be whole numbers, 1 or more.
