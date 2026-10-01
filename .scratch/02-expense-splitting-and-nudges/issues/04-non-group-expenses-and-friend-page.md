# 04: Non-group Expenses and the Friend page

**What to build:** A User records an Expense outside any Group with one or more Friends, or with new emails, who become Invited Persons and get an invite. Everyone on the Expense (Payer and Participants) is auto-friended with everyone else on it. The Expense's currency defaults to the creator's profile currency. Only the people on it can see it. A Friend page (reached from the Friends list) shows that Friend and the non-group Expenses you share.

**Blocked by:** 02 (Add an equal-split Group Expense).

**Status:** resolved

- [x] Create a non-group Expense with Friends and/or new emails (invited, invite email sent); any Split method
- [x] Everyone on the Expense ends up mutually friended (`FriendAdded` only for new Friendships)
- [x] `ExpenseCreated` Activity for everyone on the Expense
- [x] Only the Payer and Participants can see it; others get not found
- [x] Friend page lists shared non-group Expenses, newest first, with "you owe / you lent"
- [x] The seed adds a couple of non-group Expenses among the demo Users
- [x] Service-level tests cover the above

## Comments

- 2026-10-01: Done.
  - `POST /api/expenses` takes Participants by `personId` (me or a Friend) or `email` (found or invited); `payerId` is me or a Friend; currency is optional (defaults to profile currency).
  - **The creator must be on the Expense** (agreed rule).
  - `GET /api/friends/:personId` is the Friend page. `GET /api/expenses/:id` serves non-group Expenses to the people on them only.
  - Group and non-group Expenses share one `recordExpense` core.
  - The web Friend page's "Add expense" has you and that Friend only; extra emails are API-only for now.
  - Checked end-to-end through a separate dev instance. Not checked in a real browser.
