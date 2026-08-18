# Formance Studio — Project Template

The starting point for every Formance Studio project. One fixed stack — Bun +
Elysia + React 19 + Tailwind v4 — so the agent places files into a known shape
instead of inventing one each time.

## Stack

- **Runtime:** Bun
- **Server:** Elysia
- **UI:** React 19, TSX
- **Styling:** Tailwind v4
- **Database:** PostgreSQL (`pg`), only once a migration exists

## Structure

```text
server.ts              Elysia. Day one: serves ./dist and nothing else
src/
  main.tsx
  App.tsx              routes
  pages/               one file per page
  components/
    ui/                Button, Card, Input, Table, Dialog — shipped, not generated
  lib/api.ts           the only fetch call site
  styles.css           Tailwind entry + @theme
routes/                EMPTY until the app needs data
db/
  migrations/          EMPTY until the app needs tables
  migrations.auth/     auth migration, shipped INACTIVE (§5.3)
lib/
  db.ts               pg pool, unused until a migration exists
  migrate.ts          migration runner, mirroring the gateway's own
```

## Run

```bash
bun install
bun run dev      # Vite dev server
bun run build    # build client + server
bun start        # serve the built app
```

## Adding data

`routes/` and `db/migrations/` start empty. Adding data means:

1. Write a SQL file in `db/migrations/` (numbered, alphabetical order).
2. Run `bun run migrate` — transactional per file, tracked in a `migrations`
   table, re-running is a no-op.
3. Add a route handler file and mount it in `server.ts`.

The agent writes migrations as files, never ad-hoc DDL, so they survive into
the export and the receiving engineer runs the same command against their own
database.

## Auth activation

Auth ships inactive. To enable it:

1. Move `db/migrations.auth/0001_users_and_sessions.sql` into `db/migrations/`
   with the next sequence number.
2. Mount `registerAuthRoutes` and wrap protected pages in `RequireAuth`.
3. Flip `projects.has_auth` on the gateway side.

The agent enables this code; it does not write authentication from scratch.

## Environment

Copy `.env.example` to `.env` and fill:

- `DATABASE_URL` — this application's own schema/role, never the gateway's
  administrative credentials.
- `SESSION_SECRET` — a long random value for signing session cookies.

## Why this is its own repository

- **CI runs `bun install && bun run build` on every change.** A template
  nobody runs decays quietly, and the first person to find out is a user whose
  generation failed.
- **Releases are tagged, and `projects.template_version` pins what a project
  was born from.** Without that, improving the template silently changes what
  existing projects mean.
