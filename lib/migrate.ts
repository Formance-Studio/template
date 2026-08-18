import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pool } from "./db";

// Migration runner, mirroring the gateway's own: one `migrations` table inside
// the application's schema, transactional per file, append-only.
//
// The agent writes migrations as files (never ad-hoc DDL) so they survive
// into the export; the IT person runs this same command against their own
// database.
export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const dir = join(import.meta.dir, "../db/migrations");
  const executed = new Set(
    (await pool.query<{ name: string }>("SELECT name FROM migrations ORDER BY id")).rows.map(
      (r) => r.name,
    ),
  );

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (executed.has(file)) continue;
    const sql = await Bun.file(join(dir, file)).text();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

if (import.meta.main) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
