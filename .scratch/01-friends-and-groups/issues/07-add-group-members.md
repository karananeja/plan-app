# 07: Add members to an existing Group

**What to build:** Any member of a Group can add more people to it: their own Friends, or new emails (which creates Invited Persons). New members are automatically friended with every existing member, and from then on can see the Group's full history.

**Blocked by:** 06 (Create a Group and list Groups).

**Status:** resolved

- [x] Any member (not just the creator) can add Friends or new emails to the Group
- [x] New members are auto-friended with all existing members
- [x] A `GroupMemberAdded` Activity is recorded for each new member, with all members (including the new one) in the audience
- [x] Adding someone who's already a member is a no-op; non-members can't add anyone
- [x] An archived Group rejects new members
- [x] Service-level tests cover the above

## Comments

- 2026-10-01: Done. `POST /api/groups/:id/members { emails }`, shared with Group creation through one `addMembers` helper. Each newcomer is friended with everyone who joined before them, so `FriendAdded` is about the newcomer. Covered by the combined end-to-end check after Ticket 10 (see the conversation log).
