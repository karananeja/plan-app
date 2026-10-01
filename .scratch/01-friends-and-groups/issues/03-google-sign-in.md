# 03: Google sign-in

**What to build:** A visitor can sign up or sign in with Google. A Google account's email counts as verified. When the Google OAuth client ID and secret aren't configured, the Google button is hidden and the app still works with email + password.

**Blocked by:** 02 (Sign up and sign in with email + password, plus profile).

**Status:** resolved

- [x] With credentials set in the environment, "Continue with Google" signs up or signs in and creates an active Person with a verified email
- [x] Signing in with Google using an email that already has a **verified** password account signs into that same User (no duplicate Person); an unverified one is refused (see comment)
- [x] Without credentials, the Google button isn't shown and nothing errors
- [x] The example env file and README explain how to create a Google OAuth client for localhost

## Comments

- 2026-10-01: Done.
  - **Criterion narrowed:** Google links into an existing password account **only if that account's email is verified**. This is better-auth's `requireLocalEmailVerified` default, kept to prevent account pre-hijacking (someone registering your email with a password before you sign in with Google). If the email isn't verified, the user is sent back to `/sign-in?error=account_not_linked` with an explanation.
  - Tests fake only Google's token endpoint and drive the real OAuth redirect and callback.
  - **Not verified:** a real Google round-trip. That needs the user's OAuth client; README → "Google sign-in" has the steps.
