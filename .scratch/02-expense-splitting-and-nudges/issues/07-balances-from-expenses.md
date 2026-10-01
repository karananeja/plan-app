# 07: Balances from Expenses

**What to build:** Balances become real. Each Participant other than the Payer owes the Payer their Share, and the Balances implementation derives every balance from the non-deleted Expenses (ADR 0001): a person's Net Balance with each Friend (across all Groups and outside them), each member's Group Balance, and the Group Debts within a Group, always separately per currency. This replaces the zero-reporting implementation from Spec 01. The Friends list, Group page and Friend page now show real amounts, and they change as soon as Expenses are added, edited or deleted. Spec 03 later adds Settlements to the same derivation.

**Blocked by:** 02 (Add an equal-split Group Expense); 04 (Non-group Expenses and the Friend page).

**Status:** resolved

- [x] Net Balance between two people nets Debts both ways across all their Groups and non-group Expenses (the requirement's $125 / $100 → $25 example)
- [x] Group Balance per member, and Group Debts (who owes whom within a Group)
- [x] Currencies are never added together
- [ ] Editing or deleting an Expense changes the balances accordingly (**moved to tickets 05 and 06**, which add edit and delete)
- [x] Invariants: the sum of all Group Balances in a Group is 0; Net Balance(A,B) = −Net Balance(B,A)
- [x] Spec 01 guards (archive Group, leave or remove a member, remove a Friend) get real-ledger "blocked while non-zero" tests
- [x] Friends list, Group page and Friend page show the real amounts

## Comments

- 2026-10-01: Done.
  - `ledgerBalances(db)` is the app's default `Balances`, derived from non-deleted Expenses (each non-payer Participant owes the Payer their Share), per currency, nothing stored.
  - `groupDebts(groupId)` added; the Group page shows "Who owes whom", and the Friend page shows the Net Balance.
  - The "edit/delete changes balances" criterion moved to tickets 05 and 06.
