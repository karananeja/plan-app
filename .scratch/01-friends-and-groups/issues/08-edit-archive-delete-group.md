# 08: Edit, archive and delete a Group

**What to build:** Any member can rename a Group or change its emoji or colour. Any member can archive a Group, but only when every member's Group Balance is zero. An archived Group drops into an "Archived" section of the Groups list and is read-only, until any member un-archives it. The Group's creator can delete it while it has no Expenses; deletion removes it for everyone.

**Blocked by:** 06 (Create a Group and list Groups).

**Status:** resolved

- [x] Rename, change emoji, change colour: each records a `GroupUpdated` Activity with what changed
- [x] Archive succeeds only when all Group Balances (via the Balances interface) are zero, and records `GroupArchived`; archived Groups reject edits and new members
- [x] Un-archive restores normal behaviour and records `GroupUpdated`
- [x] Only the creator can delete, and it records `GroupDeleted` (members in the audience); a non-creator gets an error
- [x] The Group's currency can be changed (until Spec 02 adds Expenses, it's always changeable)
- [x] Service-level tests cover the above. Archive-blocked-by-balance is tested with a stubbed Balances interface; Spec 03 adds the real-ledger version

## Comments

- 2026-10-01: Done.
  - `PATCH /api/groups/:id` (any changed subset of name, emoji, colour, currency); `POST …/archive` and `…/unarchive`; `DELETE …` (creator only).
  - Deleting removes the Group and its memberships but keeps Activity, with the name in `GroupDeleted.data`.
  - Spec 02 still has to block deletion and currency changes once a Group has Expenses.
  - Also fixed `activityFor` ordering for events in the same millisecond (now tie-broken by insertion order).
  - Covered by the combined end-to-end check after Ticket 10.
- 2026-10-01: Combined end-to-end check for Tickets 07–10 passed (see conversation log, Entry 18).
