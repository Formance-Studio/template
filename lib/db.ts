import { Pool } from "pg";

// A single pg pool for this application. Unused until a migration exists —
// when one does, `lib/migrate.ts` runs it against DATABASE_URL and then route
// handlers import `pool` from here.
//
// The gateway provisions a dedicated schema and role per project. DATABASE_URL
// should point at that role, never at the gateway's administrative role.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
