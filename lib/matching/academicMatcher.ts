/**
 * Academic fit: program + year of study.
 * Different programs are never disqualifying — related disciplines score
 * well because mixed backgrounds bring complementary expertise.
 */

const RELATED_PROGRAMS: Record<string, string[]> = {
  "Computer Engineering": ["Computer Science", "Software Engineering", "Information Technology", "Electrical Engineering", "Electronics Engineering"],
  "Computer Science": ["Software Engineering", "Computer Engineering", "Information Technology", "Data Science"],
  "Software Engineering": ["Computer Science", "Computer Engineering", "Information Technology"],
  "Information Technology": ["Computer Science", "Software Engineering", "Computer Engineering", "Networking"],
  "Electrical Engineering": ["Electronics Engineering", "Computer Engineering", "IoT"],
  "Electronics Engineering": ["Electrical Engineering", "Computer Engineering"],
  "Data Science": ["Computer Science", "Software Engineering"],
};

export interface AcademicScore {
  program: number;
  year: number;
}

export function scoreProgram(projectProgram: string, studentProgram: string): number {
  if (!projectProgram || !studentProgram) return 0.5;
  if (projectProgram === studentProgram) return 1;
  const related = RELATED_PROGRAMS[projectProgram] ?? [];
  return related.includes(studentProgram) ? 0.7 : 0.4;
}

export function scoreYear(projectYear: number | undefined, studentYear: number): number {
  if (!projectYear) return 0.7;
  const gap = Math.abs(projectYear - studentYear);
  if (gap === 0) return 1;
  if (gap === 1) return 0.8;
  if (gap === 2) return 0.6;
  return 0.4;
}

export function scoreAcademic(
  projectProgram: string,
  projectYear: number | undefined,
  studentProgram: string,
  studentYear: number
): AcademicScore {
  return {
    program: scoreProgram(projectProgram, studentProgram),
    year: scoreYear(projectYear, studentYear),
  };
}
