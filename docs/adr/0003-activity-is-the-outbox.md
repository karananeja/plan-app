---
status: superseded by ADR-0004
---

# Activity is the outbox

Every service writes its Activity row (who did what, and who it involves) in the same database transaction as the change itself. After commit, it sends an Inngest event so the Notification dispatcher can deliver it, and a cron job re-sends any Activity not yet dispatched. We don't keep a separate domain-events or outbox table: Activity already has to record every change for the feed (Spec 04), and writing it in the same transaction guarantees that no change goes unrecorded and no notification is ever sent for a change that was rolled back.

## Consequences

- Adding a new event type means adding an Activity type and a row in the Notifications catalog. Feature modules never call notification code.
- Activity rows must hold enough data (audience, subject, diff) for the dispatcher to work without reading feature tables.
