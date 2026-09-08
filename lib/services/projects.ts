/**
 * Service layer — single place to swap mock data for Supabase.
 *
 * Pattern (from Stage 4 onwards):
 *   const useMock = !process.env.NEXT_PUBLIC_SUPABASE_URL;
 *   if (useMock) return mockProjects;
 *   return supabase.from("projects").select("*") ...
 *
 * UI components must import from here, never query Supabase directly.
 */

export async function listProjectsMockNote(): Promise<string> {
  return "mock-mode: Supabase not configured yet (Stage 1).";
}
