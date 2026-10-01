# 06: Create a Group and list Groups

**What to build:** A User can create a Group with a name, a type (trip, home, couple, other), an emoji and a colour, and a currency that defaults to their profile currency. When creating it, they can add initial members from their Friends or by new email (which creates Invited Persons, as in Ticket 04). Every member is automatically friended with every other member. The Groups list shows the User's Groups ordered by most recent Activity. A Group page shows its members, each with their Group Balance (zero for now, via the Balances interface). Only members can see a Group. The seed script adds sample Groups among the seeded Users.

**Blocked by:** 04 (Add a Friend by email, and the Friends list).

**Status:** resolved

- [x] Creating a Group records the creator as a member, plus the chosen members; new emails become Invited Persons with invite emails printed
- [x] All members end up mutually friended (`FriendAdded` Activity only for new Friendships)
- [x] `GroupCreated` and `GroupMemberAdded` Activities are recorded, with Group members in the audience
- [x] The Groups list is ordered by the latest Activity in each Group
- [x] The Group page lists members with their Group Balance from the Balances interface
- [x] A non-member gets "not found" for the Group in both the API and the UI
- [x] The seed script creates at least two sample Groups among the seeded Users
- [x] Service-level tests cover creation, auto-friending, ordering and visibility

## Comments

- 2026-10-01: Done.
  - The colour is one of 8 named colours. The emoji defaults by type (✈️ 🏠 ❤️ 👥).
  - The Group table is named `expense_group`, because `group` is an SQL keyword.
  - Group Balances come from `Balances.groupBalances` (empty until Spec 03), one entry per currency.
  - `FriendAdded` created by auto-friending is about the second person in the pair, with both ids in `data.between`.
  - Checked end-to-end through the dev proxy. Not checked in a real browser.
