import type { Student } from "@/types";

/**
 * Mock students — Stage 1 placeholder.
 * TODO (Supabase): replace with `from("profiles").select(...)` via lib/services/students.ts
 */
export const mockStudents: Student[] = [];

export const mockCurrentStudent: Student = {
  id: "me",
  fullName: "Alex Morgan",
  university: "Example University",
  program: "Computer Science",
  year: 2,
  bio: "Second-year CS student interested in web development and AI. Looking for teammates for coursework projects.",
  skills: ["React", "TypeScript", "Python"],
  interests: ["Web Development", "AI"],
  availability: ["Evening", "Weekends"],
  experienceLevel: "Intermediate",
  profileCompletion: 80,
  createdAt: new Date().toISOString(),
};
