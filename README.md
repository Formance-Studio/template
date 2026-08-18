# Formance Studio — Project Template

The skeleton every Formance Studio project is born from.

Specified in [`gateway/PRD-M3.md`](https://github.com/Formance-Studio/gateway/blob/main/PRD-M3.md) §3.

## What this is

One fixed stack — Bun, Elysia, React 19 with TSX, Tailwind v4 — so that the
generating agent never has to work out what kind of project it is looking at.

Every project is a server from the first minute. On day one `server.ts` only
serves the built frontend; `routes/` and `db/migrations/` are born empty and
fill in when the app needs data. There is no convert-to-full-stack step,
because a non-technical user never thinks "I need a backend" — they think
"save this".

## Why this is its own repository

Two reasons, both about not rotting:

- **CI runs `bun install && bun run build` on every change.** A template nobody
  ever runs decays quietly — a dependency shifts, Bun moves — and the first
  person to find out is a user whose generation failed.
- **Releases are tagged, and `projects.template_version` pins what a project
  was born from.** Without that, improving the template silently changes what
  existing projects mean, and a bug report becomes unreproducible.

## Status

Not yet implemented. See PRD-M3 §3 for the structure, the dependency
allow-list, and the rules the agent must hold to.
