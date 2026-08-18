# Migration files are added here when the app needs tables (§3.2).

# This folder stays empty until the first table. lib/migrate.ts runs every
# .sql file here in alphabetical order, transactionally, and records the name
# in a `migrations` table so re-running is a no-op.
