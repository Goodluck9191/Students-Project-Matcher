import type { Student } from "@/types";
import { mockCurrentStudent, mockStudents } from "@/lib/mock/students";

/**
 * Student service — swap point for Supabase.
 * TODO (Supabase): `from("profiles").select("*")` with RLS.
 */
export async function listStudents(): Promise<Student[]> {
  await new Promise((r) => setTimeout(r, 300));
  return [...mockStudents];
}

export async function getStudentById(id: string): Promise<Student | null> {
  await new Promise((r) => setTimeout(r, 200));
  if (id === "me") return mockCurrentStudent;
  return mockStudents.find((s) => s.id === id) ?? null;
}

export function getCurrentUserId(): string {
  return mockCurrentStudent.id;
}
