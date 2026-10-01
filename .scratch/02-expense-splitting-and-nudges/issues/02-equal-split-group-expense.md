# 02: Add an equal-split Group Expense

**What to build:** A Group Member records an Expense in their Group: description, amount, date (the calendar date on the bill), category (food, travel, rent, utilities, entertainment, other), optional note, the Payer, and the Participants, split equally. It's always in the Group's currency. The Group page lists the Group's Expenses, newest first, each showing "you owe ₹X" or "you lent ₹X" from the viewer's point of view. An Expense page shows the total, Payer, Split method and every Share. This is the tracer bullet for Expenses: the table and Participant rows store both the raw Split input and the computed Shares.

It also delivers the Spec 01 criteria that needed Expenses.

**Blocked by:** 01 (Split calculator).

**Status:** ready-for-agent

- [ ] A Group Member can create an equal-split Expense with any Group Members as Payer and Participants. Non-members as Payer or Participant are rejected
- [ ] The Expense uses the Group's currency; amount is entered as a decimal and stored in minor units
- [ ] `ExpenseCreated` Activity is recorded for all Group Members
- [ ] Group page lists Expenses (newest by date first) with the viewer's "you owe / you lent / not involved"; the Expense page shows every Share
- [ ] Only Group Members can see the Group's Expenses (others get not found)
- [ ] Carried over from Spec 01:
  - [ ] Adding an Expense to an archived Group un-archives it
  - [ ] A Group's currency can't be changed once it has Expenses
  - [ ] A Group with Expenses can't be deleted
  - [ ] An Invited Person who's a Participant still has those Expenses after claiming the invite
- [ ] The seed adds a few equal-split Expenses to the demo Groups (safe to re-run)
- [ ] Service-level tests cover the above
