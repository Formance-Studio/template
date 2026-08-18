// The only fetch call site in the app. Every page imports from here rather
// than calling fetch directly, so auth headers and error handling live in one
// place instead of being re-derived per page.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.message ?? `Request failed (${response.status})`,
    );
  }

  return (await response.json()) as T;
}
