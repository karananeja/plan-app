# 04: Non-group Expenses and the Friend page

**What to build:** A User records an Expense outside any Group with one or more Friends, or with new emails, who become Invited Persons and get an invite. Everyone on the Expense (Payer and Participants) is auto-friended with everyone else on it. The Expense's currency defaults to the creator's profile currency. Only the people on it can see it. A Friend page (reached from the Friends list) shows that Friend and the non-group Expenses you share.

**Blocked by:** 02 (Add an equal-split Group Expense).

**Status:** ready-for-agent

- [ ] Create a non-group Expense with Friends and/or new emails (invited, invite email sent); any Split method
- [ ] Everyone on the Expense ends up mutually friended (`FriendAdded` only for new Friendships)
- [ ] `ExpenseCreated` Activity for everyone on the Expense
- [ ] Only the Payer and Participants can see it; others get not found
- [ ] Friend page lists shared non-group Expenses, newest first, with "you owe / you lent"
- [ ] The seed adds a couple of non-group Expenses among the demo Users
- [ ] Service-level tests cover the above
