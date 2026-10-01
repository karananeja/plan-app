# 03: Every split method in the Expense form

**What to build:** The Expense form supports all four Split methods. Choosing Exact, Percentage or Share Units shows an input per Participant, a live preview of each Share, and how much amount or percentage is still left to assign. Saving is blocked until the Split is valid. The Payer can be someone other than me, and needn't be a Participant (e.g. a gift). The API accepts and stores every method.

**Blocked by:** 02 (Add an equal-split Group Expense).

**Status:** resolved

- [x] The API accepts Exact Amounts, Percentage and Share Units, storing each Participant's raw input and computed Share
- [x] Invalid Splits are rejected with the calculator's message (e.g. "₹20.00 left to assign")
- [x] The Payer may be any Group Member, including one who isn't a Participant
- [x] The form shows per-Participant inputs, live Shares and "remaining", and disables Save while invalid
- [x] Service-level tests cover each method end to end and the Payer-not-Participant case

## Comments

- 2026-10-01: Done.
  - Input is `participants: [{ personId, value? }]` with `value` as typed. It's read by the shared `parseSplitValue` (domain), so the form preview and the API agree.
  - Splits that don't add up give 400 with "₹200.00 left to assign" / "1.00% too much" (shared `describeRemaining`) and `remaining`.
  - The Expense detail returns each Participant's raw input for Ticket 05's edit form.
  - **Open question:** `docs/specs/README.md` says the web app gets component tests for logic-heavy pieces, naming the split editor. This ticket agreed "no automated web test". See the conversation log.
- 2026-10-01: Open question resolved: the user chose to add the split editor component test (see conversation log, Entry 11).
