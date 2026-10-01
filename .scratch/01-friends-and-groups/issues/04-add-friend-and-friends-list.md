# 04: Add a Friend by email, and the Friends list

**What to build:** A User can add a Friend by email. If the email belongs to an existing User, they become Friends both ways immediately. If not, a new Invited Person is created, becomes a Friend, and an invite email with a join link is printed to the API console. Adding the same email twice, from any User, always resolves to the same Person. The Friends list shows each Friend with their Net Balance ("Settled up" for now) and can be searched by name or email.

This ticket introduces two seams later tickets reuse:
- **Activity recording**: each change writes its Activity row (type, actor, audience, subject) in the same database transaction as the change itself. No feed UI yet (Spec 04).
- **Balances interface**: a small interface the Friends list and later guards ask for Net Balance and Group Balance. Its v1 implementation reports zero, because no Transactions exist yet; Spec 03 replaces it.

**Blocked by:** 02 (Sign up and sign in with email + password, plus profile).

**Status:** ready-for-agent

- [ ] Adding an existing User's email creates a mutual Friendship and a `FriendAdded` Activity, with both people in the audience
- [ ] Adding an unknown email creates an Invited Person, a mutual Friendship, `PersonInvited` and `FriendAdded` Activities, and prints an invite email with a join link
- [ ] Adding an email that's already an Invited Person (from any User) reuses that Person; adding an existing Friend again is a no-op
- [ ] You can't add yourself as a Friend
- [ ] The Friends list shows each Friend's name/email, an Invited badge where relevant, and their Net Balance from the Balances interface; search filters by name or email
- [ ] Activity rows are written in the same transaction as the change: a test shows that a failed change leaves no Activity
- [ ] Service-level tests cover all of the above
