# 02 — Expense Splitting & Nudges

- Spec: [docs/specs/02-expense-splitting-and-nudges.md](../../docs/specs/02-expense-splitting-and-nudges.md)
- Conversation log: [docs/conversation-logs/02-expense-splitting-and-nudges.md](../../docs/conversation-logs/02-expense-splitting-and-nudges.md)
- Tickets: [issues/](./issues/)

## Ticket graph

```
01 split calculator
└─ 02 equal-split Group Expense (+ Spec 01 carry-overs)
   ├─ 03 every split method in the form
   │  └─ 05 edit with history
   ├─ 04 non-group Expenses + Friend page
   ├─ 06 delete & restore
   └─ 07 Balances from Expenses  (also blocked by 04)
      └─ 08 Nudge a Friend
         └─ 09 Nudge everyone who owes me in a Group
```

## Notes

- **Real Balances move into this spec** (ticket 07): Debts from Expenses replace the zero-reporting Balances. Spec 03 adds Settlements on top.
- Until Spec 05's notification centre exists, a debtor sees Nudges as a banner on Home (ticket 08). Linking a Nudge to "settle up" waits for Spec 03.
