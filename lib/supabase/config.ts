/**
 * Supabase configuration gate (Stage 11).
 *
 * The app runs in two modes:
 * - Mock mode (default): env vars absent → services use local/mock state.
 * - Supabase mode: env vars present → services query PostgreSQL via RLS.
 *
 * UI code must branch on `isSupabaseConfigured()` — never on raw env vars.
 */

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

/** Server-only secret name. There is intentionally no accessor: server code
 * reads process.env.SUPABASE_SERVICE_ROLE_KEY directly where provisioning
 * scripts need it, so the key can never flow into client bundles. */

export const NOT_CONFIGURED_ERROR =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example and README).";
