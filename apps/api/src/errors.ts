/** A rule the user broke (e.g. adding yourself as a Friend). Returned to the client as 400, with any `details`. */
export class RuleError extends Error {
  constructor(message: string, readonly details: Record<string, unknown> = {}) {
    super(message);
  }
}

/** The thing doesn't exist, or the caller isn't allowed to see it. Returned as 404. */
export class NotFoundError extends Error {}
