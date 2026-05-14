import { execSync } from "child_process";

// Prisma 7 validates DATABASE_URL even during `prisma generate`.
// If the URL is missing or has an unrecognised scheme, the build fails.
// This script passes a valid dummy URL to prisma generate only, then
// uses the real URL (or none) for the migration + Next.js build steps.

const url = process.env.DATABASE_URL ?? "";
const isValid = /^(libsql|libsqls|wss?|https?|file):/.test(url);
const generateEnv = { ...process.env, DATABASE_URL: isValid ? url : "file:./dummy.db" };

console.log(`DATABASE_URL ${isValid ? "is valid — using real URL" : "is missing/invalid — using dummy for prisma generate"}`);

execSync("npx prisma generate", { stdio: "inherit", env: generateEnv });
execSync("node scripts/migrate.mjs", { stdio: "inherit" });
execSync("npx next build", { stdio: "inherit" });
