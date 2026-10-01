# 07: Balances from Expenses

**What to build:** Balances become real. Each Participant other than the Payer owes the Payer their Share, and the Balances implementation derives every balance from the non-deleted Expenses (ADR 0001): a person's Net Balance with each Friend (across all Groups and outside them), each member's Group Balance, and the Group Debts within a Group, always separately per currency. This replaces the zero-reporting implementation from Spec 01. The Friends list, Group page and Friend page now show real amounts, and they change as soon as Expenses are added, edited or deleted. Spec 03 later adds Settlements to the same derivation.

**Blocked by:** 02 (Add an equal-split Group Expense); 04 (Non-group Expenses and the Friend page).

**Status:** ready-for-agent

- [ ] Net Balance between two people nets Debts both ways across all their Groups and non-group Expenses (the requirement's $125 / $100 → $25 example)
- [ ] Group Balance per member, and Group Debts (who owes whom within a Group)
- [ ] Currencies are never added together
- [ ] Editing or deleting an Expense changes the balances accordingly
- [ ] Invariants: the sum of all Group Balances in a Group is 0; Net Balance(A,B) = −Net Balance(B,A)
- [ ] Spec 01 guards (archive Group, leave or remove a member, remove a Friend) get real-ledger "blocked while non-zero" tests
- [ ] Friends list, Group page and Friend page show the real amounts
