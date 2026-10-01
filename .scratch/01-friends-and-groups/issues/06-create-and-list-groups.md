# 06: Create a Group and list Groups

**What to build:** A User can create a Group with a name, a type (trip, home, couple, other), an emoji and a colour, and a currency that defaults to their profile currency. When creating it, they can add initial members from their Friends or by new email (which creates Invited Persons, as in Ticket 04). Every member is automatically friended with every other member. The Groups list shows the User's Groups ordered by most recent Activity. A Group page shows its members, each with their Group Balance (zero for now, via the Balances interface). Only members can see a Group. The seed script adds sample Groups among the seeded Users.

**Blocked by:** 04 (Add a Friend by email, and the Friends list).

**Status:** ready-for-agent

- [ ] Creating a Group records the creator as a member, plus the chosen members; new emails become Invited Persons with invite emails printed
- [ ] All members end up mutually friended (`FriendAdded` Activity only for new Friendships)
- [ ] `GroupCreated` and `GroupMemberAdded` Activities are recorded, with Group members in the audience
- [ ] The Groups list is ordered by the latest Activity in each Group
- [ ] The Group page lists members with their Group Balance from the Balances interface
- [ ] A non-member gets "not found" for the Group in both the API and the UI
- [ ] The seed script creates at least two sample Groups among the seeded Users
- [ ] Service-level tests cover creation, auto-friending, ordering and visibility
