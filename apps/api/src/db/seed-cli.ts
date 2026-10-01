import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { authSecret, databasePath, webOrigin } from "../config.ts";
import { seed } from "../seed.ts";
import { openDb } from "./client.ts";

const path = databasePath();
mkdirSync(dirname(path), { recursive: true });
const db = openDb(path);
await seed(db, { secret: authSecret(), origin: webOrigin() });
db.$client.close();
console.log(`Seeded ${path}. Sign in as asha|ben|chen|divya@example.com with password "demo-password". Asha has created two demo Groups.`);
