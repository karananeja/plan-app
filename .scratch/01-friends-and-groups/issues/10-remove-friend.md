# 10: Remove a Friend

**What to build:** A User can remove a Friend, but only when their Net Balance is zero and they share no non-archived Group. Otherwise the app explains what's blocking it ("You still share Goa Trip" or "You're not settled up"). Removal is mutual and hides each from the other's Friends list.

**Blocked by:** 04 (Add a Friend by email, and the Friends list); 06 (Create a Group and list Groups).

**Status:** ready-for-agent

- [ ] Removal succeeds when the Net Balance is zero and there's no shared non-archived Group, and records `FriendRemoved` with both in the audience
- [ ] Removal is rejected while they share a non-archived Group, naming the Group(s)
- [ ] Removal is rejected when the Net Balance is non-zero (tested with a stubbed Balances interface; Spec 03 adds the real-ledger version)
- [ ] Sharing only archived Groups doesn't block removal
- [ ] After removal, re-adding the Friend by email works normally
- [ ] Service-level tests cover the above
