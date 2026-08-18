-- Auth migration — shipped INACTIVE (§5.3).
--
-- This file lives outside db/migrations/ so lib/migrate.ts never runs it by
-- default. Activating auth means moving it into db/migrations/ (with the next
-- sequence number), mounting routes/auth.ts, and flipping projects.has_auth
-- on the gateway side. The agent enables this code; it does not write it.

CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    email         VARCHAR(320) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
