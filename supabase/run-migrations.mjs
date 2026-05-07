// Run database migrations against Supabase — splits on semicolons and executes individually.
// Usage: node supabase/run-migrations.mjs

import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: 5432,
  database: "postgres",
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const MIGRATION_FILES = [
  join(__dirname, "migrations", "001_initial_schema.sql"),
  join(__dirname, "seed", "002_seed_decks.sql"),
  join(__dirname, "seed", "003_fix_ben10.sql"),
];

/** Split SQL file into individual statements, skipping blank/comment-only ones */
function splitStatements(sql) {
  return sql
    .split(/;\s*\n/) // split on semicolon + newline
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"))
    .map((s) => s + ";"); // re-add the semicolon
}

async function run() {
  console.log("Connecting to Supabase...");
  await client.connect();
  console.log("Connected.\n");

  for (const filePath of MIGRATION_FILES) {
    const fileName = filePath.split(/[\\/]/).pop();
    console.log(`\n── Running: ${fileName} ──`);
    const sql = readFileSync(filePath, "utf-8");
    const statements = splitStatements(sql);
    let ok = 0, failed = 0;

    for (const stmt of statements) {
      const preview = stmt.slice(0, 60).replace(/\n/g, " ");
      try {
        await client.query(stmt);
        ok++;
      } catch (err) {
        // These are expected on re-runs (already exists, duplicate key, etc.)
        const isExpected =
          err.message.includes("already exists") ||
          err.message.includes("duplicate key") ||
          err.message.includes("DO NOTHING");
        if (!isExpected) {
          console.error(`  ✗ FAILED: ${preview}...`);
          console.error(`    ${err.message}`);
        }
        failed++;
      }
    }
    console.log(`  ${ok} succeeded · ${failed} skipped/failed`);
  }

  await client.end();
  console.log("\nMigrations complete.");
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
