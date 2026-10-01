import { serve } from "@hono/node-server";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createApp } from "./app.ts";
import { apiPort, authSecret, databasePath, webOrigin } from "./config.ts";
import { openDb } from "./db/client.ts";
import { consoleEmailSender } from "./email.ts";

const path = databasePath();
mkdirSync(dirname(path), { recursive: true });
const app = createApp({
  db: openDb(path),
  email: consoleEmailSender,
  auth: { secret: authSecret(), origin: webOrigin() },
});

serve({ fetch: app.fetch, port: apiPort() }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
