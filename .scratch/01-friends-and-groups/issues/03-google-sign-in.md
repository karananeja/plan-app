# 03: Google sign-in

**What to build:** A visitor can sign up or sign in with Google. A Google account's email counts as verified. When the Google OAuth client ID and secret aren't configured, the Google button is hidden and the app still works with email + password.

**Blocked by:** 02 (Sign up and sign in with email + password, plus profile).

**Status:** ready-for-agent

- [ ] With credentials set in the environment, "Continue with Google" signs up or signs in and creates an active Person with a verified email
- [ ] Signing in with Google using an email that already has a password account signs into that same User (no duplicate Person)
- [ ] Without credentials, the Google button isn't shown and nothing errors
- [ ] The example env file and README explain how to create a Google OAuth client for localhost
