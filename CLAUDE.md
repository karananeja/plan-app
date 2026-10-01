# plan-app

A bill-splitting app: record shared Expenses, split them among Friends and Groups, see netted balances, and Nudge people to settle up. v1 runs locally. Start with `docs/specs/README.md` for the current decisions and stack.

## Agent skills

### Issue tracker

Local markdown: tickets live in `.scratch/<feature-slug>/issues/`, and specs stay in `docs/specs/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix), recorded as a `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
