import { vi } from "vitest";
import type { browser } from "./app.ts";

type Profile = { email: string; name: string; email_verified?: boolean };

/** An unsigned JWT. better-auth decodes (doesn't verify) the id token it gets back from Google's token endpoint. */
function idToken(profile: Profile) {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${part({ alg: "none", typ: "JWT" })}.${part({
    iss: "https://accounts.google.com",
    sub: `google-${profile.email}`,
    email_verified: true,
    ...profile,
  })}.`;
}

/**
 * Signs in with Google as `profile`: starts the OAuth redirect, then completes the callback
 * while Google's token endpoint (an external system) is faked.
 */
export async function signInWithGoogle(b: ReturnType<typeof browser>, profile: Profile) {
  const start = await b.post("/api/auth/sign-in/social", { provider: "google", callbackURL: "/", errorCallbackURL: "/sign-in" });
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state");

  const realFetch = globalThis.fetch;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    if (String(input instanceof Request ? input.url : input).startsWith("https://oauth2.googleapis.com/token")) {
      return Response.json({ access_token: "fake-access", token_type: "Bearer", expires_in: 3600, id_token: idToken(profile) });
    }
    return realFetch(input, init);
  });
  try {
    return await b.get(`/api/auth/callback/google?code=fake-code&state=${state}`);
  } finally {
    vi.unstubAllGlobals();
  }
}
