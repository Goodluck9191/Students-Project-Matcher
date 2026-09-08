import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 * Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Safe to use in Client Components. Never use service-role keys here.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Return a no-op–friendly stub during Stage 1 / mock mode so the
    // app renders without env vars. Replace with a throw once Auth lands.
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — running in mock mode."
    );
  }

  return createBrowserClient(url ?? "http://localhost:54321", anonKey ?? "mock-anon-key");
}
