import { serve } from "@hono/node-server";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createApp } from "./app.ts";
import { apiPort, databasePath } from "./config.ts";
import { openDb } from "./db/client.ts";

const path = databasePath();
mkdirSync(dirname(path), { recursive: true });
const app = createApp({ db: openDb(path) });

serve({ fetch: app.fetch, port: apiPort() }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
