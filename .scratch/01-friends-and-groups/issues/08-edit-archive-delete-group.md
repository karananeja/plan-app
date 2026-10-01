# 08: Edit, archive and delete a Group

**What to build:** Any member can rename a Group or change its emoji or colour. Any member can archive a Group, but only when every member's Group Balance is zero. An archived Group drops into an "Archived" section of the Groups list and is read-only, until any member un-archives it. The Group's creator can delete it while it has no Expenses; deletion removes it for everyone.

**Blocked by:** 06 (Create a Group and list Groups).

**Status:** ready-for-agent

- [ ] Rename, change emoji, change colour: each records a `GroupUpdated` Activity with what changed
- [ ] Archive succeeds only when all Group Balances (via the Balances interface) are zero, and records `GroupArchived`; archived Groups reject edits and new members
- [ ] Un-archive restores normal behaviour and records `GroupUpdated`
- [ ] Only the creator can delete, and it records `GroupDeleted` (members in the audience); a non-creator gets an error
- [ ] The Group's currency can be changed (until Spec 02 adds Expenses, it's always changeable)
- [ ] Service-level tests cover the above. Archive-blocked-by-balance is tested with a stubbed Balances interface; Spec 03 adds the real-ledger version
