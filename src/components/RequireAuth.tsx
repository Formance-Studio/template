import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";

// Auth wrapper — shipped INACTIVE (§5.3). Wrap a protected page with
// <RequireAuth> to require a session; the agent enables this code, it does
// not write it.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "authed" | "unauthed">("loading");

  useEffect(() => {
    api<{ user: { id: string } | null }>("/api/auth/me")
      .then((r) => setState(r.user ? "authed" : "unauthed"))
      .catch(() => setState("unauthed"));
  }, []);

  if (state === "loading") return null;
  if (state === "unauthed") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
