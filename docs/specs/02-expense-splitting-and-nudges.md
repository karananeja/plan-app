# Spec 02 — Expense Splitting & Nudges

> Requirement 1: A user can ask friends to pay for bills and split them as needed, nudging them through the app instead of reminding them manually.
> _e.g. I pay for the food at a restaurant and split the bill among 4 people by share or percentage._
> Log: [conversation-logs/02-expense-splitting-and-nudges.md](../conversation-logs/02-expense-splitting-and-nudges.md)

## Problem Statement

When I pay a shared bill, I have to work out each person's portion by hand, often unevenly (someone had a starter, someone skipped drinks). Then I have to remember to chase each of them. Uneven splits are tedious and easy to get wrong, and reminding friends repeatedly is awkward, so small amounts often go unpaid.

## Solution

I record an Expense once: amount, who paid, who took part, and how to split it (equally, exact amounts, percentages, or Share Units). The app works out each Participant's Share, guarantees the Shares add up to the total exactly, and creates the Debts. When someone hasn't settled, I tap **Nudge** and the app sends the reminder for me.

### Worked example

Dinner costs **$200.00**. I pay. Four of us take part: me, A, B and C.

| Method | Input | Shares (me / A / B / C) |
|---|---|---|
| Equal | — | 50.00 / 50.00 / 50.00 / 50.00 |
| Percentage | 40% / 20% / 20% / 20% | 80.00 / 40.00 / 40.00 / 40.00 |
| Share Units | 2 / 1 / 1 / 1 | 80.00 / 40.00 / 40.00 / 40.00 |
| Exact | 70 / 50 / 50 / 30 | 70.00 / 50.00 / 50.00 / 30.00 |

In every case, A, B and C each owe me their Share. My own Share is what I consumed, so it isn't owed to anyone.

## User Stories

### Creating expenses
1. As a User, I want to add an Expense with a description, amount, date and currency, so that a shared bill is on record.
2. As a User, I want to add an Expense inside a Group, so that it counts toward that Group's balances.
3. As a User, I want to add an Expense with one or more Friends outside any Group, so that one-off bills don't need a Group.
4. As a User, I want to choose who the Payer was (me or someone else), so that I can record bills a friend paid.
5. As a User, I want to choose which people are Participants, so that people who weren't there aren't charged.
6. As a User, I want the Payer to be optional as a Participant, so that I can record paying for something I didn't consume (e.g. a gift).
7. As a User, I want to split equally by default, so that the common case takes one tap.
8. As a User, I want to split by exact amounts, so that itemised bills are recorded precisely.
9. As a User, I want to split by percentage, so that agreed proportions (e.g. 60/40 rent) are easy.
10. As a User, I want to split by Share Units, so that "Alex had two portions" is easy to express.
11. As a User, I want live feedback showing the remaining amount or percentage still to assign, so that I can fix mistakes before saving.
12. As a User, I want saving blocked when exact amounts don't add up to the total or percentages don't add up to 100%, so that bad data can't be recorded.
13. As a User, I want leftover cents from rounding assigned predictably, so that Shares always add up to the total exactly.
14. As a User, I want to pick a category (food, travel, rent, utilities, entertainment, other), so that my spending overview is meaningful (Spec 04).
15. As a User, I want to add a note (_receipt photo deferred from v1_), so that others can check the bill.
16. As a User, I want to see each Participant's computed Share before saving, so that I can confirm it's right.

### Editing & deleting
17. As a Participant or Payer, I want to edit an Expense, so that mistakes can be corrected.
18. As a Participant or Payer, I want to delete an Expense, so that duplicates can be removed.
19. As a Participant, I want to see the edit history of an Expense (who changed what and when), so that changes are transparent.
20. As a User, I want to restore a deleted Expense, so that accidental deletions can be undone.
21. As a User, I want balances to update immediately after any edit or delete, so that what I see is always current.

### Viewing
22. As a Participant, I want to open an Expense and see the total, Payer, Split method and every Share, so that I understand what I owe.
23. As a Participant, I want to see "you owe $X" or "you lent $X" on each Expense, so that my position is obvious at a glance.

### Nudging
24. As a creditor, I want to Nudge a Friend who owes me, so that I don't have to message them myself.
25. As a creditor, I want the Nudge to state the Net Balance owed (Spec 03), so that the request is clear and correct.
26. As a creditor, I want to Nudge from a Friend's page, a Group's page, or an Expense, so that it's available wherever I notice the debt.
27. As a creditor, I want to Nudge everyone who owes me in a Group in one action, so that I don't do it one by one.
28. As a creditor, I want to add an optional short message to a Nudge, so that it feels personal.
29. As a creditor, I want to be stopped from sending more than one Nudge to the same person within 24 hours, so that I don't spam them.
30. As a creditor, I want to see when I last nudged someone, so that I know whether to nudge again.
31. As a debtor, I want a Nudge to link straight to the screen where I can record a Settlement, so that paying back takes as few steps as possible.
32. As a User, I want Nudge disabled when the person doesn't owe me, so that I can't nudge by mistake.
33. _(Deferred from v1.)_ As a creditor, I want to be able to Nudge an Invited Person (by email), so that people not yet on the app can still be reminded.

## Implementation Decisions

- **Modules**
  - *Expenses*: create/edit/delete/restore Expenses, revision history.
  - *Split calculator*: a pure, deep module. Input: total, method, Participants and their inputs. Output: Share per Participant, or a validation error. It has no I/O, so it's the most heavily tested piece.
  - *Nudges*: rate limiting, recording Nudges, emitting events.
- **Expense shape (indicative)**
  ```
  Expense { id, groupId?, description, category, date, currency, totalMinor,
            payerId, splitMethod: equal|exact|percentage|shares,
            participants: [{ personId, input?, shareMinor }],
            notes?, createdBy, version, deletedAt? }
  ```
  `date` is a calendar date with no time or timezone (the date on the bill, in the creator's local time). It's stored and shown as-is to everyone.
  `input` is the raw user input: amount, percent (stored as basis points, e.g. 33.33% = 3333) or units. `shareMinor` is the computed result, stored so that changes to the rounding rules don't change old Expenses.
- **Rounding rule**: compute exact rational Shares and floor each to the minor unit. Hand out the leftover minor units one at a time by largest fractional remainder. Break ties by Participant order as entered. Σ shares must equal total exactly; this is an invariant.
- **Validation**: at least one Participant; total > 0; Exact must sum to the total; Percentage must sum to 100.00%; Share Units must be positive integers; Group Expenses may only include Group Members; for non-group Expenses, the Payer and Participants may be any of the creator's Friends or new Invited Persons. Everyone on the Expense is then auto-friended with everyone else on it (Spec 01).
- **Single Payer in v1.** Multiple payers are out of scope.
- **Debts derivation**: each Participant other than the Payer owes the Payer their `shareMinor`. Expenses never maintain balances themselves.
- **Real Balances are built in this spec** (ticket 07): a Ledger-backed `Balances` implementation derives Net Balance, Group Balance and Group Debts from Expenses, replacing Spec 01's zero-reporting one. Spec 03 adds Settlements and Settlement Allocation to the same derivation. — **why:** Nudges need real balances, and "balances update immediately" (story 21) is a Spec 02 story.
- **Edits create a new revision.** The previous revision is kept for history and the Activity diff. Optimistic concurrency uses `version`.
- **Who may edit**: the creator, the Payer, or any Participant. In a Group, any Group Member.
- **Nudge rules**: the target must be a User; Nudge is disabled for Invited Persons in v1. Nudges are delivered in-app only (Spec 05). Allowed only if the Net Balance (Spec 03) shows the target owes the nudger more than 0. Rate limit: 1 per (nudger, target) per rolling 24h. The Nudge carries the current Net Balance amount and currency, plus an optional message of up to 140 chars. Nudging a Group nudges each member who owes the nudger, by the amount of their **Group Debt** to the nudger.
- **Debtor-side Nudges before Spec 05**: the nudged person sees undismissed Nudges as a banner on Home. Linking a Nudge to a settle-up screen waits for Spec 03.
- **Friend page**: shows a Friend and the non-group Expenses you share, with the Nudge button.
- **Events emitted**: `ExpenseCreated`, `ExpenseUpdated` (with diff), `ExpenseDeleted`, `ExpenseRestored`, `NudgeSent`.
- **API surface (indicative)**: `previewSplit(input)`, `createExpense(input)`, `updateExpense(id, version, input)`, `deleteExpense(id)`, `restoreExpense(id)`, `getExpense(id)`, `getExpenseHistory(id)`, `sendNudge(targetId, {groupId?, message?})`, `nudgeGroupDebtors(groupId, message?)`.

## Testing Decisions

- **Split calculator**: exhaustive table-driven tests on the pure function. Cover every method, the $200 worked example above, indivisible totals (e.g. $100 / 3 → 33.34 / 33.33 / 33.33), zero-unit and negative inputs, percentages summing to 99.99/100.01, and a property test that Σ shares = total for random inputs.
- **Expenses and Nudges** go through the application service seam: create/edit/delete, then assert on returned Expense, emitted events, and the resulting Net Balance (via the real Balances module).
- Nudge tests use a controllable clock to check the 24h rate limit.
- Prior art: Spec 01 service tests.

## Out of Scope

- Multiple payers on one Expense.
- Receipt photo attachments (need file storage). Itemised receipt scanning / OCR.
- Recurring Expenses (monthly rent auto-created).
- Currency conversion.
- Adjustment-style splits ("equal plus $5 for A").
- Collecting money in the app (payment links, UPI intents). Possible future work.
- **Payment Requests**: asking for money in advance, before any Expense exists (e.g. "everyone send me $50 for the villa"). In v1, Debts only come from Expenses that have been recorded. Possible future spec.

## Further Notes

### Carried over from Spec 01

These Spec 01 criteria need Expenses, so they're built and tested here:
- An Invited Person's Expenses are still theirs after they claim the invite (same Person, no migration).
- Adding an Expense to an archived Group un-archives it.
- A Group's currency can't be changed once it has Expenses, and a Group with Expenses can't be deleted.
- The seed script adds sample Expenses (group and non-group) among the seeded Users.

### Other notes

- "Ask friends to pay" in the original requirement is met by Debts appearing in their balances plus Nudges. No separate "request" object exists.
- Storing both `input` and `shareMinor` keeps old Expenses stable and lets the edit UI reproduce what the user typed.
- Tickets: [`.scratch/02-expense-splitting-and-nudges/`](../../.scratch/02-expense-splitting-and-nudges/README.md).
