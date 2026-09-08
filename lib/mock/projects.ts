import type { Project } from "@/types";

/**
 * Mock projects — Stage 4 realistic dataset.
 * TODO (Supabase): replace with `from("projects").select(...)`.
 */

const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const mockProjects: Project[] = [
  {
    id: "asset-management",
    title: "University Asset Management System",
    description:
      "Build a system for tracking and managing university assets — lab equipment, rooms, and maintenance requests.",
    category: "Web Development",
    projectType: "Coursework",
    creatorId: "me",
    creatorName: "Alex Morgan",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "UI/UX"],
    interests: ["Web Development", "Software Engineering"],
    maxTeamSize: 5,
    currentMembers: 3,
    deadline: daysFromNow(42),
    matchPercentage: 92,
    createdAt: daysAgo(6),
  },
  {
    id: "study-buddy",
    title: "Study Buddy Finder",
    description:
      "Match students into study groups by course, availability, and learning goals. Mobile-first web app.",
    category: "Web Development",
    projectType: "Hackathon",
    creatorId: "priya-nair",
    creatorName: "Priya Nair",
    requiredSkills: ["React", "TypeScript", "Supabase", "UI/UX"],
    interests: ["Web Development", "Mobile Apps"],
    maxTeamSize: 4,
    currentMembers: 2,
    deadline: daysFromNow(21),
    matchPercentage: 88,
    createdAt: daysAgo(3),
  },
  {
    id: "campus-events",
    title: "Campus Event Hub",
    description:
      "Discover, RSVP, and get reminders for seminars, club fairs, and sports events across campus.",
    category: "Mobile Apps",
    projectType: "Side Project",
    creatorId: "john-michael",
    creatorName: "John Michael",
    requiredSkills: ["React", "Node.js", "Testing"],
    interests: ["Mobile Apps", "Software Engineering"],
    maxTeamSize: 5,
    currentMembers: 4,
    deadline: daysFromNow(30),
    matchPercentage: 85,
    createdAt: daysAgo(10),
  },
  {
    id: "iot-weather",
    title: "IoT Campus Weather Station",
    description:
      "Low-cost sensor network reporting temperature and rainfall to a live dashboard for the agriculture faculty.",
    category: "IoT",
    projectType: "Research",
    creatorId: "tom-becker",
    creatorName: "Tom Becker",
    requiredSkills: ["Python", "IoT", "Networking", "Documentation"],
    interests: ["IoT", "Embedded Systems"],
    maxTeamSize: 4,
    currentMembers: 1,
    deadline: daysFromNow(60),
    matchPercentage: 74,
    createdAt: daysAgo(2),
  },
  {
    id: "library-booking",
    title: "Library Seat Booking App",
    description:
      "Reserve library seats in real time and get notified when your favourite spot frees up.",
    category: "Software Engineering",
    projectType: "Coursework",
    creatorId: "me",
    creatorName: "Alex Morgan",
    requiredSkills: ["React", "Supabase", "Testing", "Documentation"],
    interests: ["Web Development", "Software Engineering"],
    maxTeamSize: 3,
    currentMembers: 3,
    deadline: daysFromNow(14),
    matchPercentage: 90,
    createdAt: daysAgo(20),
  },
];
