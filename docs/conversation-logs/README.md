# Conversation Logs

One log per feature, paired with its spec in [`docs/specs/`](../specs/). A log records **how** a feature was built: what was asked, what was decided and why, what changed, and what's still open. The spec says *what* to build; the log says *how it went*.

## Rules

- **Append-only.** Add a new entry at the bottom for every working session (human or agent) that touches the feature. Never rewrite past entries. If something turned out wrong, say so in a new entry.
- **One entry per session.** If a session touches two features, add an entry to each log.
- **Decisions that change the spec** are logged here *and* applied to the spec in the same session. The log entry links the spec section that changed.
- **Keep it short and factual.** Summarise prompts; don't paste whole transcripts. Quote the user only where the exact wording matters.
- **No secrets or personal data** (API keys, tokens, real phone numbers or emails).

## Entry template

Copy this to the bottom of the relevant log:

```md
## Entry N — YYYY-MM-DD — <short title>

**Session goal:** <what this session set out to do>
**Participants:** <user / agent(s)>

### Asked
- <summary of user requests or prompts>

### Decided
- <decision> — **why:** <reason>

### Changed
- <files/modules added or modified, tests added, commits/PRs>

### Verified
- <tests run and results, manual checks>

### Open / Next
- [ ] <follow-up item>
```

## Logs

| # | Feature | Spec | Status |
|---|---------|------|--------|
| 01 | Friends & Groups | [spec](../specs/01-friends-and-groups.md) · [log](./01-friends-and-groups.md) | Spec drafted |
| 02 | Expense Splitting & Nudges | [spec](../specs/02-expense-splitting-and-nudges.md) · [log](./02-expense-splitting-and-nudges.md) | Spec drafted |
| 03 | Balances & Settlements | [spec](../specs/03-balances-and-settlements.md) · [log](./03-balances-and-settlements.md) | Spec drafted |
| 04 | Activity & Spend Overview | [spec](../specs/04-activity-and-spend-overview.md) · [log](./04-activity-and-spend-overview.md) | Spec drafted |
| 05 | Notifications | [spec](../specs/05-notifications.md) · [log](./05-notifications.md) | Spec drafted |
