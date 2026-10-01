# 05: Claim an invite once the email is verified

**What to build:** An Invited Person opens their join link and lands on sign-up with their email prefilled. Once that account's email is verified, the Invited Person becomes an active User. It's the same Person, so their Friendships (and, later, their Expenses and Group memberships) are already there. An unverified account never claims an invite. Google sign-up claims the invite immediately, because Google emails are verified.

**Blocked by:** 04 (Add a Friend by email, and the Friends list).

**Status:** resolved

- [x] The join link opens sign-up with the email prefilled
- [x] Signing up with a password and the invited email does **not** claim the invite until the verification link is used; after verification, the Invited Person is active and keeps its Friendships
- [x] An `InviteClaimed` Activity is recorded, with the inviting Friends in the audience
- [x] Signing up with the invited email without using the link also claims it once verified (matching is by verified email, not by link)
- [x] When Ticket 03 is done, Google sign-up with the invited email claims it immediately
- [x] Service-level tests cover claim-on-verify, no-claim-while-unverified, and no duplicate Person

## Comments

- 2026-10-01 (from Ticket 04): **Currently broken.** Signing up with an email that already has an Invited Person returns 500, because the sign-up hook tries to insert a second Person with the same email. This ticket must replace that: no new Person for an invited email, and the existing one is claimed when the email is verified. Until then, the User exists but has no Person, so decide what `/api/me` and signed-in routes show in that window. Add a test for exactly this sign-up.
- 2026-10-01: Done. The invited-email sign-up 500 is fixed. Between sign-up and verification, the User has no Person (`inviteWaiting: true`, 403 on Person routes, "verify to continue" screen). Verification, or a Google sign-up, claims the same Person id, takes the sign-up name, and records `InviteClaimed`. Checked end-to-end through the dev proxy. Not checked in a real browser.
