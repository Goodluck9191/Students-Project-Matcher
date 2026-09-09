/** Shared action result: UI branches on `code` (NOT_CONFIGURED → mock fallback). */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

export function notConfigured<T>(): ActionResult<T> {
  return {
    ok: false,
    code: "NOT_CONFIGURED",
    error:
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
  };
}

export function fail<T>(code: string, error: string): ActionResult<T> {
  return { ok: false, code, error };
}

export function done<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}
