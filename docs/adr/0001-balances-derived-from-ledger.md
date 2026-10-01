# Balances are derived from the Ledger, never stored as the source of truth

Every balance (Net Balance, Group Balance, Group Debt, Overall Balance) is computed from the Ledger: the non-deleted Expenses and Settlements. Any cached balance is a disposable projection, and tests check that it matches a full recompute. We chose this over keeping running balance columns that each write updates. Users edit, delete and restore old Expenses freely (high-trust model), and running totals would drift silently on every such change. Deriving balances also lets every number on screen be explained by listing the Transactions behind it.

## Consequences

- Reading a balance costs a query over the Ledger. At friends scale this is cheap; if it stops being cheap, add a rebuildable projection rather than switching to stored balances.
- No feature may write a balance directly. Features only add or change Transactions.
