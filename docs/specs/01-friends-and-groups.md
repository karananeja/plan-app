# Spec 01 — Friends & Groups

> Requirement 4: A user can create a group, add their friends to it, and create splits for the expenses.
> Log: [conversation-logs/01-friends-and-groups.md](../conversation-logs/01-friends-and-groups.md)

## Problem Statement

People who share costs regularly (flatmates, trip companions, colleagues at lunch) have no shared place to record who is in on what. Every time someone pays, they have to remember who was involved and message each person separately. Without a stable list of the people involved, splitting and tracking debts has to start from scratch each time.

## Solution

Users build a friend list by inviting people by email, whether or not those people have signed up yet. They can then create Groups ("Goa Trip", "Flat 4B"), add Friends as Group Members, and record Expenses inside the Group (Spec 02). People who are invited but haven't signed up can still take part in Expenses. When they join, they find their history waiting for them.

## User Stories

1. As a User, I want to sign up with Google, or with my email and a password, and have a profile with my name, email, and avatar, so that friends can recognise me.
2. As a User, I want to add a Friend by email address, so that I can split expenses with them.
3. _(Deferred from v1.)_ As a User, I want to add a Friend by phone number, so that I can add people whose email I don't know.
4. _(Deferred from v1.)_ As a User, I want to pick Friends from my phone contacts, so that I don't have to type their details.
5. As a User, I want to add someone who isn't on the app yet, so that I can record expenses with them immediately.
6. As an Invited Person, I want to receive an invite link by email, so that I can join and see what's been shared with me.
7. As an Invited Person, I want my existing expenses and balances to be attached to my account when I sign up, so that nothing is lost.
8. As a User, I want an invite I've already sent to be matched when that person signs up with the same email, so that duplicates aren't created.
9. As a User, I want to see my Friends list with each Friend's Net Balance, so that I know where I stand with each person.
10. As a User, I want to search my Friends list, so that I can find someone quickly.
11. As a User, I want to remove a Friend once we're Settled Up and share no active Group, so that my list stays tidy.
12. As a User, I want to be prevented from removing a Friend while we still owe each other money or share a non-archived Group, so that debts aren't silently lost and the Friendship isn't immediately recreated.
13. As a User, I want to create a Group with a name, an emoji and colour (an uploaded image is deferred from v1) and optional type (trip, home, couple, other), so that I can organise related Expenses.
14. As a User, I want to add Friends to a Group when I create it, so that I can start splitting straight away.
15. As a Group Member, I want to add more people to an existing Group, including people who aren't yet my Friends, so that latecomers can join.
16. As a person added to a Group, I want to automatically become Friends with the other Group Members, so that I can see shared balances.
17. As a Group Member, I want to see all Group Members and each one's Group Balance, so that I know who's up and who's down.
18. As a Group Member, I want to rename the Group or change its emoji and colour, so that it stays relevant.
19. As a Group Member, I want to leave a Group when my Group Balance is zero, so that I stop getting its updates.
20. As a Group Member, I want to be blocked from leaving a Group while I have a non-zero Group Balance, so that others aren't left with unrecoverable debts.
21. As a Group Member, I want to remove another member whose Group Balance is zero, so that the Group reflects who's actually involved.
22. As a Group Member, I want to archive a Group once everyone is Settled Up, so that finished trips don't clutter my list while history is kept.
23. As a Group creator, I want to delete a Group that has no Expenses, so that mistakes can be undone.
24. As a User, I want to see a list of my Groups ordered by most recent activity, so that active Groups are easy to reach.
25. As a User, I want to set a default currency on a Group, so that every Expense in it uses the same currency.
26. As a User, I want each Group change (member added/removed, renamed, archived) to be recorded, so that everyone can see what happened (feeds Spec 04/05).

## Implementation Decisions

- **Modules**
  - *Identity*: Users, sign-up, matching Invited Persons on sign-up.
  - *Friendship*: mutual friend links between people.
  - *Groups*: Groups, Group Members, group lifecycle (active → archived).
- **Person identity**: one `Person` concept covers both a User and an Invited Person (`status: invited | active`). Expenses always reference a Person, so claiming an invite is a status change, not a data migration.
- **Sign-in**: better-auth with Google sign-in and email + password. Google emails count as verified. Password accounts must verify their email (by an emailed link) before they can claim an invite, and can reset a forgotten password by an emailed link. Locally, the `EmailSender` prints verification links, reset links and invite emails (with the join link) to the API console. A seed script creates several users with known passwords (already verified), sample Groups and Expenses.
- **Invites are by email only in v1.** An Invited Person is claimed when an account's email is **verified** (at Google sign-up, or when a password account clicks its verification link), never on an unverified sign-up. Between sign-up and verification, that User has **no Person**: `/api/me` reports `inviteWaiting: true`, routes that need a Person return 403, and the app shows a "verify your email to continue" screen. Claiming keeps the Invited Person's id, takes the name chosen at sign-up, and records `InviteClaimed` for the Person and their Friends. Phone numbers aren't collected in v1.
- **Removing a Friend** is blocked while the Net Balance isn't zero or the two share any non-archived Group.
- **Auto-friending** happens in two cases: everyone in the same Group, and everyone on the same non-group Expense (Payer and Participants), all become Friends with each other.
- **Friendship is mutual and automatic**: adding someone creates the link both ways with no accept step in v1. Being in the same Group creates Friendships between all members.
- **Group permissions are flat in v1**: any Group Member can add members, rename, and archive. Only the creator can delete, and only while the Group has no Expenses.
- **Leaving or removal requires a zero Group Balance.** The balance check goes through the Balances module (Spec 03) interface, not a direct ledger query. Until Spec 03 is built, that interface's implementation reports zero (there are no Transactions yet), and guard tests use a stub.
- **Group currency** is set at creation and can't be changed once the Group has Expenses. It defaults to the creator's **profile currency**, which is prefilled from their locale (e.g. INR) and editable in their profile. Non-group Expenses default to the profile currency too.
- **Archived Groups** are read-only. Adding an Expense to one un-archives it automatically.
- **Visibility**:
  - Group Expenses and Settlements: visible to every Group Member, including members who weren't involved, and including history from before a member joined.
  - Non-group Expenses: visible only to the Payer and Participants.
  - Non-group Settlements: visible only to the two parties.
  - Balances: you see your own Net Balances; within a Group, every member sees all Group Balances and Group Debts.
- **Events emitted**: `FriendAdded`, `FriendRemoved`, `PersonInvited`, `InviteClaimed`, `GroupCreated`, `GroupUpdated`, `GroupMemberAdded`, `GroupMemberRemoved`, `GroupMemberLeft`, `GroupArchived`, `GroupDeleted`.
- **API surface (indicative)**: `addFriend(contact)`, `removeFriend(personId)`, `listFriends()`, `createGroup(name, currency, memberIds)`, `addGroupMembers(groupId, memberIds)`, `leaveGroup(groupId)`, `removeGroupMember(groupId, personId)`, `archiveGroup(groupId)`, `deleteGroup(groupId)`, `listGroups()`.

## Testing Decisions

- Test through the application service / API seam only: call the operations above and assert on returned state and emitted events. Don't assert on tables or internals.
- Key behaviours to cover:
  - An invite claimed on sign-up keeps Expense history.
  - Duplicate invites with the same contact resolve to one Person.
  - Leaving or removal is blocked with a non-zero Group Balance and allowed at zero.
  - Group-induced Friendships are created.
  - Archived Groups reject edits and un-archive when an Expense is added.
- Balance checks use the real Balances module with ledger fixtures rather than a mock, so the rule stays honest.
- Prior art: none yet (greenfield). This spec sets the pattern.

## Out of Scope

- Account deletion. Post-v1 plan: anonymise the person as "Deleted user" and keep their Transactions, allowed only once all their Net Balances are zero. Hard delete is never allowed, because it would change other people's balances.
- Group roles (admin vs member) and per-member permissions.
- Friend requests that need acceptance, and blocking users.
- Multiple currencies inside one Group.
- Shared/public Group invite links (anyone with the link can join).
- Phone-number invites, SMS, and the contact picker. The browser Contact Picker API is Android Chrome only.

## Further Notes

- Archive vs delete: deleting destroys history and is only allowed for empty Groups. Archive is the normal end-of-life.
- Spec 02 depends on Group membership: Participants of a Group Expense must be Group Members.
- Tickets: [`.scratch/01-friends-and-groups/`](../../.scratch/01-friends-and-groups/README.md). Criteria that need Expenses were moved to Spec 02 (see its "Carried over from Spec 01").
