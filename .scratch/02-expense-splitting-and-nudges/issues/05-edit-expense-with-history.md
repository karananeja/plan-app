# 05: Edit an Expense, with history

**What to build:** Anyone allowed to edit an Expense (its creator, the Payer, any Participant, or, for a Group Expense, any Group Member) can change any of its details through the same form used to create it. Each edit keeps the previous version. The Expense page shows its history: who changed what, and when. If two people edit at once, the second save is rejected with "this Expense was changed by someone else; reload".

**Blocked by:** 03 (Every split method in the Expense form).

**Status:** ready-for-agent

- [ ] Edit amount, description, date, category, note, Payer, Participants and Split; Shares are recomputed
- [ ] Saving with a stale version is rejected (409) and changes nothing
- [ ] `ExpenseUpdated` Activity records a readable diff (e.g. amount ₹800 → ₹900) for everyone involved, before or after the edit
- [ ] The Expense page shows its history, newest first
- [ ] People who aren't allowed to edit get not found / rejected
- [ ] The edit form reproduces what was originally typed (raw Split input)
- [ ] Service-level tests cover the above
