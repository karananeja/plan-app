# Settlements outside a Group are allocated across Groups, oldest Debt first, and the allocation is stored

A Settlement recorded from a Friend's page (not inside a Group) is automatically split into Settlement Allocations across the Groups and the non-group bucket where the payer owes the recipient, oldest outstanding Debt first; any overpayment goes to the non-group bucket. The allocation is computed when the Settlement is recorded and stored with it, not recomputed later. This keeps Net Balance and Group Balances consistent ("I paid X back" also clears my Goa Trip debt to X, so I can leave the Group), and storing it means later edits to old Expenses can't silently move money between Groups.

## Considered Options

- **Non-group bucket only** (original spec): Net Balance correct, but Group Balances stayed non-zero, which was confusing and blocked leaving Groups.
- **User picks a Group every time**: precise, but adds friction and doesn't match how people think about paying a friend back.
- **Recompute allocation on every read**: no stored state, but editing an old Expense would reshuffle past Settlements between Groups.
