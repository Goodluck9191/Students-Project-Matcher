import type { StudentProfile } from "@/types";

/**
 * Mock student profile — Stage 3 development data.
 * TODO (Supabase): replace with `from("profiles").select("*").eq("id", userId)`
 * via lib/services/profile.ts. No passwords or auth data live here.
 */
export const mockProfile: StudentProfile = {
  id: "me",
  fullName: "Alex Morgan",
  bio: "Second-year Computer Science student who loves building modern web apps. Looking for teammates for coursework and hackathon projects.",
  university: "Mbeya University of Science and Technology",
  department: "Computer Science and Engineering",
  program: "Computer Science",
  year: 2,
  graduationYear: "2028",
  skills: [
    { skill: "React", level: "Intermediate" },
    { skill: "TypeScript", level: "Intermediate" },
    { skill: "PostgreSQL", level: "Beginner" },
  ],
  interests: ["Web Development", "Artificial Intelligence", "Software Engineering"],
  availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
  dayTimes: ["Evening"],
  workStyle: "Hybrid",
  availability: ["Weekdays", "Weekends", "Evening"],
  experienceLevel: "Intermediate",
  previousExperience:
    "Built a library booking web app (React + Supabase) for a Year 1 course. Contributed UI fixes to an open-source study planner.",
  profileCompletion: 92,
  updatedAt: new Date().toISOString(),
};

/** Blank draft used to initialise the setup wizard. */
export function emptyProfileDraft(): StudentProfile {
  return {
    id: "me",
    fullName: "",
    bio: "",
    university: "",
    department: "",
    program: "",
    year: 1,
    graduationYear: "",
    skills: [],
    interests: [],
    availableDays: [],
    dayTimes: [],
    workStyle: undefined,
    availability: [],
    experienceLevel: "Beginner",
    previousExperience: "",
    profileCompletion: 0,
    updatedAt: new Date().toISOString(),
  };
}
