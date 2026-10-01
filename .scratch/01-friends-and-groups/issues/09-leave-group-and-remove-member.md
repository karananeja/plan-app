# 09: Leave a Group, and remove a member

**What to build:** A member can leave a Group, and any member can remove another member, but only when that person's Group Balance is zero. After leaving or being removed, the person no longer sees the Group in their list and can't open it. Their past Activity in the Group stays.

**Blocked by:** 06 (Create a Group and list Groups).

**Status:** ready-for-agent

- [ ] Leaving succeeds at zero Group Balance and records `GroupMemberLeft`; the Group disappears from the leaver's list and becomes "not found" for them
- [ ] Removing another member succeeds at zero Group Balance and records `GroupMemberRemoved`, with the removed person in the audience
- [ ] Both are rejected with a clear message when the Group Balance is non-zero (tested with a stubbed Balances interface; Spec 03 adds the real-ledger version)
- [ ] The last remaining member can't leave; they archive or delete the Group instead
- [ ] Friendships created by the Group are not removed when someone leaves
- [ ] Service-level tests cover the above
