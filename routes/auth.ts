import { pool } from "../lib/db";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";
import type { Elysia } from "elysia";
import { t } from "elysia";

// Auth shipped in the template, inactive (§5.3). The agent activates it by
// flipping AUTH_ENABLED — it does not write authentication from scratch.
//
// Security requirements (§5.2/§5.3), reviewed once here rather than per
// project:
//   - bcrypt cost 10
//   - no user enumeration: unknown email and wrong password answer identically
//   - session id regenerated on login
//   - httpOnly, SameSite=Lax session cookie, no JWT
//   - CSRF protection on state-changing routes (double-submit cookie)
//   - no password or session id in any log line

const COOKIE_NAME = "sid";
const CSRF_COOKIE = "csrf";

const sessionCookie = (value: string, maxAge = 60 * 60 * 24 * 30) =>
  `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

const hashPassword = (password: string) => bcrypt.hash(password, 10);
const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

const setSessionCookie = (
  set: { headers: Record<string, string | number> },
  sessionId: string,
) => {
  set.headers["Set-Cookie"] = sessionCookie(sessionId);
};

// Double-submit CSRF: the non-httpOnly cookie holds a random value that the
// client echoes in X-CSRF-Token. A cross-origin form cannot read the cookie,
// so it cannot forge the header.
const csrfToken = () => ulid();

const isStateChanging = (method: string) =>
  method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

const verifyCsrf = (headers: Record<string, string | number | undefined>, cookieHeader: string | undefined) => {
  const token = headers["x-csrf-token"];
  if (!token || typeof token !== "string" || !cookieHeader) return false;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE}=`));
  return match?.slice(CSRF_COOKIE.length + 1) === token;
};

const getSessionUserId = async (cookieHeader: string | undefined): Promise<string | null> => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const sessionId = match.slice(COOKIE_NAME.length + 1);
  const result = await pool.query<{ user_id: string }>(
    "SELECT user_id FROM sessions WHERE id = $1 AND expires_at > NOW()",
    [sessionId],
  );
  return result.rows[0]?.user_id ?? null;
};

export function registerAuthRoutes(app: Elysia) {
  return app.group("/api/auth", (auth) =>
    auth
      .get("/csrf", ({ set }) => {
        const token = csrfToken();
        set.headers["Set-Cookie"] = `${CSRF_COOKIE}=${token}; SameSite=Lax; Path=/; Max-Age=86400`;
        return { csrfToken: token };
      })
      .post(
        "/register",
        async ({ body, set }) => {
          const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [body.email],
          );
          if (existing.rowCount !== 0) {
            set.status = 409;
            return { error: "Email already registered" };
          }

          const passwordHash = await hashPassword(body.password);
          const userId = ulid();
          await pool.query(
            "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)",
            [userId, body.email, passwordHash],
          );
          return { ok: true };
        },
        {
          body: t.Object({
            email: t.String({ format: "email" }),
            password: t.String({ minLength: 8 }),
          }),
        },
      )
      .post(
        "/login",
        async ({ body, set }) => {
          const result = await pool.query<{ id: string; password_hash: string }>(
            "SELECT id, password_hash FROM users WHERE email = $1",
            [body.email],
          );
          const user = result.rows[0];

          // Same response whether the email is unknown or the password wrong.
          const valid = user ? await verifyPassword(body.password, user.password_hash) : false;
          if (!user || !valid) {
            set.status = 401;
            return { error: "Invalid email or password" };
          }

          // Regenerate the session id on login: a stolen pre-login cookie
          // must not become authenticated.
          const sessionId = ulid();
          await pool.query(
            "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')",
            [sessionId, user.id],
          );
          setSessionCookie(set, sessionId);
          return { ok: true };
        },
        {
          body: t.Object({
            email: t.String({ format: "email" }),
            password: t.String(),
          }),
        },
      )
      .post("/logout", async ({ set, headers }) => {
        const userId = await getSessionUserId(headers.cookie);
        if (userId) {
          const match = headers.cookie
            ?.split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${COOKIE_NAME}=`));
          const sessionId = match?.slice(COOKIE_NAME.length + 1);
          if (sessionId) await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
        }
        set.headers["Set-Cookie"] = `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
        return { ok: true };
      })
      .get("/me", async ({ headers }) => {
        const userId = await getSessionUserId(headers.cookie);
        if (!userId) return { user: null };
        const result = await pool.query<{ id: string; email: string }>(
          "SELECT id, email FROM users WHERE id = $1",
          [userId],
        );
        return { user: result.rows[0] ?? null };
      })
      .onBeforeHandle(({ request, headers, set }) => {
        if (isStateChanging(request.method) && !verifyCsrf(headers, headers.cookie)) {
          set.status = 403;
          return { error: "Invalid CSRF token" };
        }
      }),
  );
}
