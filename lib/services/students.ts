import type { Student } from "@/types";
import { mockCurrentStudent, mockStudents } from "@/lib/mock/students";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { mapProfile, type DbProfile } from "@/lib/supabase/mappers";

/**
 * Student service — swap point for Supabase.
 * Supabase mode: `profiles` table via RLS (browser client, anon key).
 * Mock mode: local fixtures. UI code is identical either way.
 */

async function listStudentsDb(): Promise<Student[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, academic_program, year, bio, experience_level, skills, interests, availability, role, is_active, profile_completed, created_at")
    .eq("role", "student")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as DbProfile[]).map((r) => mapProfile(r));
}

export async function listStudents(): Promise<Student[]> {
  if (isSupabaseConfigured()) return listStudentsDb();
  await new Promise((r) => setTimeout(r, 300));
  return [...mockStudents];
}

export async function getStudentById(id: string): Promise<Student | null> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error || !data) return null;
    return mapProfile(data as DbProfile);
  }
  await new Promise((r) => setTimeout(r, 200));
  if (id === "me") return mockCurrentStudent;
  return mockStudents.find((s) => s.id === id) ?? null;
}

export function getCurrentUserId(): string {
  // Mock-mode identity. Supabase mode resolves the id from the session
  // (see lib/supabase/auth.ts); callers prefer explicit ids there.
  return mockCurrentStudent.id;
}
