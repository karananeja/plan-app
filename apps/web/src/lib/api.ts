import type { AppType } from "@plan-app/api";
import { hc } from "hono/client";

/** Typed RPC client for the API. Requests go to /api, which Vite proxies in dev. */
export const api = hc<AppType>("/").api;
