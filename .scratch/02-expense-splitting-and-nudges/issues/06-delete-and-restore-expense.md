# 06: Delete and restore an Expense

**What to build:** Anyone allowed to edit an Expense can delete it. It disappears from lists, but it's kept so it can be restored and so history still makes sense. A "show deleted" toggle on the Group page and Friend page reveals deleted Expenses, with a Restore action.

**Blocked by:** 02 (Add an equal-split Group Expense).

**Status:** ready-for-agent

- [ ] Delete hides the Expense from lists and records `ExpenseDeleted`
- [ ] Deleted Expenses can be listed on request and restored, recording `ExpenseRestored`
- [ ] Deleted Expenses don't count toward "a Group with Expenses" (currency lock, delete block)
- [ ] People who aren't allowed to edit can't delete or restore
- [ ] Service-level tests cover the above
