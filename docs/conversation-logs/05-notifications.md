# Conversation Log — Notifications

Spec: [../specs/05-notifications.md](../specs/05-notifications.md) · Format: [README](./README.md)

---

## Entry 1 — 2026-10-01 — Requirements captured, spec drafted

**Session goal:** Turn the original product requirements into a feature spec.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Requirement 5: the user must be notified of any event change in the app.

### Decided
- Every Activity involving a user (except their own actions) becomes an in-app Notification that cannot be disabled. — **why:** satisfies "notified of any event change" literally.
- Push and email follow per-category preferences, with per-Group mute; Nudges and Settlements bypass mute. — **why:** avoids notification fatigue without losing time-sensitive events.
- The dispatcher consumes Activity records; feature modules never call notification code. — **why:** new events need only an emitter and a catalog row.
- At-least-once delivery via an outbox, idempotency keys, retries with backoff, and 2-min coalescing of rapid edits. — **why:** reliability without duplicate pushes.
- Invited Persons get a limited set of emails/SMS with join and unsubscribe links, rate-limited. — **why:** reaches people not yet on the app without spamming them.

### Changed
- Created `docs/specs/05-notifications.md`.
- Created `GLOSSARY.md` (shared vocabulary across all specs) and `docs/specs/README.md` (index + cross-cutting decisions).

### Verified
- No code yet. Spec reviewed for consistency with the glossary and the other specs.

### Open / Next
- [ ] Choose push/email/SMS providers once the stack is decided.
- [ ] Confirm the default channel matrix in the spec.
- [ ] Resolve the cross-cutting open questions in [docs/specs/README.md](../specs/README.md) (stack, auth, currency, test seam).
- [ ] Break the spec into tickets and start implementation. Log each session as a new entry below.

---

## Entry 2 — 2026-10-01 — Grilling round 1 (decisions + vocabulary)

**Session goal:** Settle root product decisions and sharpen domain language (`/grill-with-docs`).
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Answered round 1 questions Q1–Q14 with "yes go ahead". Claude took this to mean all recommended answers were accepted.

### Decided
- Cross-cutting: MVP for real use; installable web app (PWA) with web push; Google sign-in + email one-time code; one currency per Group / non-group Expense; high-trust model. See [specs README](../specs/README.md#product-decisions-grilling-round-1-2026-10-01).
- Notification defaults confirmed (Q10): in-app always on; push/email per category; Group mute; Nudges and Settlements bypass mute.
- Push channel = Web Push (VAPID), following from the PWA platform decision.

### Changed
- `docs/specs/05-notifications.md`: push adapter wording.

### Verified
- Read the changed specs against `GLOSSARY.md` for consistent terms.

### Open / Next
- [ ] Round 2: email provider; weekly digest and Invited Person SMS in v1?

---

## Entry 3 — 2026-10-01 — Grilling round 2 (stack, v1 scope, edge cases)

**Session goal:** Choose the stack and v1 scope, and settle the edge cases raised by round 1.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 2 questions Q15–Q22. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- Stack (Q15): TypeScript, Next.js, Postgres + Drizzle, Auth.js, Vercel + Neon, Inngest/Vercel Cron, Resend. Domain logic in framework-free TS modules. See [specs README](../specs/README.md#product-decisions-grilling-round-2-2026-10-01).
- Weekly digest and SMS cut from v1 (Q16). Email goes through Resend; push uses Web Push.
- Invited Persons are contacted by email only.

### Changed
- `docs/specs/05-notifications.md`: stories 17 and 19, channel adapters, catalog (removed the digest row), Invited Person rule, Out of Scope.

### Verified
- Grepped specs for leftover phone/SMS/receipt/digest references after the scope cuts.

### Open / Next
- [ ] Round 3: test seam and test database, how domain events are delivered (in-process vs outbox), repo layout.

---

## Entry 4 — 2026-10-01 — Grilling round 3 (engineering shape)

**Session goal:** Settle the test seam, event delivery, API style, layout, dates, currency default, and where tickets live.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 3 questions Q23–Q29. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- Shared: Vitest + PGlite against the service layer; Activity as the outbox; Server Actions; a single Next.js app; GitHub Issues for tickets. See [specs README](../specs/README.md#engineering-decisions-grilling-round-3-2026-10-01).
- The dispatcher is triggered by an Inngest event sent after commit, with a cron job re-sending undispatched Activities (Q24).

### Changed
- `docs/specs/05-notifications.md`: Delivery decision.

### Open / Next
- [ ] Round 4: repo name/visibility, data visibility rules, account deletion, ADR for Activity-as-outbox.

---

## Entry 5 — 2026-10-01 — Grilling round 4 (final branches)

**Session goal:** Close the remaining branches of the design tree.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 4 questions Q30–Q33. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- The repo will be a private GitHub repo named `plan-app` (Q30). It won't be created until the user confirms the overall design.
- ADR 0003 records why the dispatcher reads from Activity rather than a separate events table (Q33).

### Changed
- `docs/adr/0003-activity-is-the-outbox.md`.

### Open / Next
- [ ] The user confirms the overall design, then: git init, GitHub repo, `/setup-matt-pocock-skills`, tickets, TDD implementation.

---

## Entry 6 — 2026-10-01 — Grilling round 5 (stack change for v1)

**Session goal:** Re-plan v1 around a stack change requested by the user.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- User: "few changes in tech stack for v1: use react/vite for frontend with shadcn and tailwind; use node.js for backend and choose sqlite for db; notifications can be simple polling mechanism".
- Follow-up answers:
  - Q37: in-app only.
  - Q38: "it is a local set up for v1".
  - Q41: accepted Hono / Drizzle + better-sqlite3 / better-auth / pnpm workspace / Vitest + in-memory SQLite.
  - Q42: "locally usable for v1".
  - Q43: "have the google login support but seed with some users and have email login for them".
  - Q44: (a).
  - Q45: (b).
  - Q46: "keep in app simple notifications".

### Decided
- The new stack replaces rounds 2–3 (Next.js/Postgres/Vercel/Inngest/Auth.js/PGlite are gone). See [specs README → Current decisions](../specs/README.md#current-decisions).
- In-app only, by polling: unread count every 30 s while the tab is visible, plus on focus (Q37 b).
- Preferences, Group mute, coalescing, retries, push and email are all dropped (Q44 a).
- Notifications are a view over Activity, with no table and no dispatcher (Q46). ADR 0004 supersedes ADR 0003.
- Per-item read state is needed for "mark one read". Added an `ActivityReadItem` alongside `lastReadAt`. — **why:** `lastReadAt` alone can only do mark-all.

### Changed
- `docs/specs/README.md`: decision sections rewritten as "Current decisions".
- `docs/specs/05-notifications.md`: rewritten for v1 (stories 14, 15, 17–22 deferred).
- `docs/adr/0003-activity-is-the-outbox.md`: marked superseded.
- `docs/adr/0004-notifications-are-a-view-over-activity.md`: new.
- `GLOSSARY.md`: Notification redefined as a view of an Activity; Channel removed.

### Open / Next
- [ ] The user confirms the overall design, then: git init, private GitHub repo `plan-app`, `/setup-matt-pocock-skills`, tickets, TDD implementation.
