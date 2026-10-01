# 02: Sign up and sign in with email + password, plus profile

**What to build:** A visitor can sign up with name, email and password, verify their email by a link, sign in, sign out, and reset a forgotten password. Signed-in users land on an app shell; signed-out users are sent to sign-in. Each account is backed by an active Person (the identity Expenses will reference later). A User can view and edit their profile: name, avatar (initials-based is fine) and profile currency, which is prefilled from the browser locale. All outgoing email goes through an email-sender abstraction that, locally, prints the message and its link to the API console. A seed script creates about 4 verified Users with known passwords so the app can be tried as several people.

**Blocked by:** 01 (Workspace scaffold and walking skeleton).

**Status:** ready-for-agent

- [ ] Sign-up creates a User and an active Person; the verification link is printed to the API console, and opening it marks the email verified
- [ ] Sign-in, sign-out and session persistence across reloads work; protected pages redirect to sign-in
- [ ] "Forgot password" prints a reset link to the console; using it sets a new password
- [ ] Profile page shows and edits name, avatar and profile currency (default from locale, e.g. INR)
- [ ] The seed script creates about 4 verified Users with documented passwords; re-running it is safe
- [ ] Service-level tests cover sign-up creating an active Person, the profile currency default, and profile updates
