# 03: Every split method in the Expense form

**What to build:** The Expense form supports all four Split methods. Choosing Exact, Percentage or Share Units shows an input per Participant, a live preview of each Share, and how much amount or percentage is still left to assign. Saving is blocked until the Split is valid. The Payer can be someone other than me, and needn't be a Participant (e.g. a gift). The API accepts and stores every method.

**Blocked by:** 02 (Add an equal-split Group Expense).

**Status:** ready-for-agent

- [ ] The API accepts Exact Amounts, Percentage and Share Units, storing each Participant's raw input and computed Share
- [ ] Invalid Splits are rejected with the calculator's message (e.g. "₹20.00 left to assign")
- [ ] The Payer may be any Group Member, including one who isn't a Participant
- [ ] The form shows per-Participant inputs, live Shares and "remaining", and disables Save while invalid
- [ ] Service-level tests cover each method end to end and the Payer-not-Participant case
