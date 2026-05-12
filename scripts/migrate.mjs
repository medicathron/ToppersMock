import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error("DATABASE_URL is not set — skipping migration");
  process.exit(0);
}

const client = createClient({ url, authToken });

const sqlPath = join(__dirname, "../prisma/migrations/20260512004515_init/migration.sql");
const sql = readFileSync(sqlPath, "utf-8");

const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

console.log(`Running ${statements.length} migration statements against Turso...`);

for (const stmt of statements) {
  try {
    await client.execute(stmt);
  } catch (e) {
    if (e.message && e.message.includes("already exists")) {
      // idempotent — table/index already created on a previous deploy
    } else {
      console.error("Migration failed on:", stmt.slice(0, 80));
      console.error(e.message);
      process.exit(1);
    }
  }
}

console.log("Migration complete.");
