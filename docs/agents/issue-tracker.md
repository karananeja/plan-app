# Issue tracker: Local Markdown

Tickets for this repo live as markdown files in `.scratch/`. Specs live in `docs/specs/`, not in `.scratch/`. `.scratch/` is committed to git.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`, where the slug matches the spec's file name (e.g. `.scratch/01-friends-and-groups/` for `docs/specs/01-friends-and-groups.md`)
- The spec is `docs/specs/<feature-slug>.md`. Each `.scratch/<feature-slug>/README.md` links to it; don't copy the spec into `.scratch/`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments about a ticket append to the bottom of its file under a `## Comments` heading
- Implementation history (what was asked, decided, changed and verified in each session) goes in the feature's conversation log, `docs/conversation-logs/<feature-slug>.md`, not in ticket files. See `docs/conversation-logs/README.md`

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory and its `README.md` link to the spec if needed). When a skill wants to publish a **spec**, write it to `docs/specs/<feature-slug>.md` instead, and add it to the index in `docs/specs/README.md`.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
