import postgres from "postgres";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = postgres(url, { max: 1 });
const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");
// node-postgres style drivers choke on multi-statement strings; the `postgres`
// package runs them fine with .unsafe().
await sql.unsafe(schema);
console.log("schema applied");
await sql.end();
