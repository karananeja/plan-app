# 07: Add members to an existing Group

**What to build:** Any member of a Group can add more people to it: their own Friends, or new emails (which creates Invited Persons). New members are automatically friended with every existing member, and from then on can see the Group's full history.

**Blocked by:** 06 (Create a Group and list Groups).

**Status:** ready-for-agent

- [ ] Any member (not just the creator) can add Friends or new emails to the Group
- [ ] New members are auto-friended with all existing members
- [ ] A `GroupMemberAdded` Activity is recorded for each new member, with all members (including the new one) in the audience
- [ ] Adding someone who's already a member is a no-op; non-members can't add anyone
- [ ] An archived Group rejects new members
- [ ] Service-level tests cover the above
