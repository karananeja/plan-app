import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { databasePath } from "../config.ts";
import { openDb } from "./client.ts";

const path = databasePath();
mkdirSync(dirname(path), { recursive: true });
openDb(path).$client.close();
console.log(`Migrations applied to ${path}`);
