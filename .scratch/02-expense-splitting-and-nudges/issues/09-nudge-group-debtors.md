# 09: Nudge everyone who owes me in a Group

**What to build:** On a Group page, one "Nudge everyone who owes me" action nudges each Group Member whose Group Debt to me is positive, by that amount. Anyone I've nudged in the last 24 hours, or who hasn't joined yet, is skipped. The app then tells me who was nudged and who was skipped, and why.

**Blocked by:** 08 (Nudge a Friend).

**Status:** ready-for-agent

- [ ] Nudges every member whose Group Debt to me is positive, with that amount and the Group noted on the Nudge
- [ ] Skips Invited Persons and anyone nudged by me in the last 24 hours, and reports each skip with its reason
- [ ] Nothing owed to me in the Group → a clear "no one owes you here" result
- [ ] One `NudgeSent` Activity per nudged person
- [ ] Service-level tests cover the above
