/** A rule the user broke (e.g. adding yourself as a Friend). Returned to the client as 400. */
export class RuleError extends Error {}

/** The thing doesn't exist, or the caller isn't allowed to see it. Returned as 404. */
export class NotFoundError extends Error {}
