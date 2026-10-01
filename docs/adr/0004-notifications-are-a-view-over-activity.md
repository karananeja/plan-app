# Notifications are a view over Activity

v1 is a local app with in-app notifications only, delivered by polling. A person's Notifications are therefore just a query: the Activity rows they're in the audience of, minus their own actions, plus read state. There is no Notification table, dispatcher, job runner or delivery retry. Each Activity is still written in the same transaction as the change that caused it, so when push or email arrives, a dispatcher can be added on top of Activity (as ADR 0003 described) without touching any feature module.

## Considered Options

- **Keep ADR 0003's outbox and dispatcher**: built for push and email, which v1 no longer has. Extra moving parts for no user-visible benefit.
- **Real-time transport (WebSockets/SSE)**: instant updates, but needs connection management. Polling every 30 s while the tab is visible is enough at local scale.
