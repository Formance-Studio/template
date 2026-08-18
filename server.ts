import { Elysia } from "elysia";

// The day-one server: serve the built React app and nothing else.
//
// `routes/` and `db/migrations/` are deliberately empty. They exist so a
// project can grow into data without changing shape — a migration file is
// added, a route is added — rather than being "converted" to a backend later.
// An empty folder is a signal, not a stub.

const app = new Elysia()
  // When auth is activated, the RequireAuth wrapper and routes/auth.ts mount
  // here (see the "Auth activation" section of README.md). The agent enables
  // that code; it does not write it.
  .get("/api/health", () => ({ status: "ok" }))
  .all("*", async ({ request }) => {
    // Serve ./dist when it exists (production); Vite handles dev.
    const url = new URL(request.url);
    const file = Bun.file(`./dist${url.pathname === "/" ? "/index.html" : url.pathname}`);
    if (await file.exists()) {
      return new Response(file);
    }
    // SPA fallback: unknown client routes resolve to index.html so React Router
    // can handle them.
    const index = Bun.file("./dist/index.html");
    if (await index.exists()) {
      return new Response(index);
    }
    return new Response("Not found", { status: 404 });
  })
  .listen(Number(process.env.PORT) || 3000);

console.log(`App running at http://localhost:${app.server?.hostname}:${app.server?.port}`);
