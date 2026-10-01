# 08: Nudge a Friend

**What to build:** When a Friend owes me (their Net Balance with me is positive in some currency), I can Nudge them from their Friend page or from an Expense they owe on, optionally with a short message. The Nudge records how much they owed at that moment. I can't Nudge someone who doesn't owe me, someone who hasn't joined yet, or the same person again within 24 hours, and the app shows when I last nudged them. The person I nudged sees a banner on Home ("Asha nudged you about ₹500: 'dinner on Friday'") until they dismiss it.

**Blocked by:** 07 (Balances from Expenses).

**Status:** ready-for-agent

- [ ] Nudge succeeds only when the target owes me; it stores the owed amount(s) and currency, and an optional message (≤ 140 characters)
- [ ] Rejected for Invited Persons, when nothing is owed, and within 24 hours of my last Nudge to them (controllable clock in tests)
- [ ] `NudgeSent` Activity for both people
- [ ] Friend page and Expense page show a Nudge button (disabled with a reason when not allowed) and "last nudged …"
- [ ] The debtor sees undismissed Nudges as a banner on Home and can dismiss them
- [ ] Service-level tests cover the above
