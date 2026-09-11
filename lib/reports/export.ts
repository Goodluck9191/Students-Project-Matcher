import type { ReportBundle } from "@/lib/services/admin";

/**
 * Report export helpers (Stage 10+).
 * Pure functions over the already-loaded ReportBundle — no extra queries,
 * so the downloaded file always matches what the admin sees on screen.
 */

/** CSV-escape one cell (exported for tests). */
export function esc(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function section(title: string, rows: [string, string | number][]): string[] {
  return [
    title,
    "Metric,Value",
    ...rows.map(([label, value]) => `${esc(label)},${esc(value)}`),
    "",
  ];
}

/** Flatten the admin report bundle into CSV text. */
export function reportToCSV(report: ReportBundle, generatedAt: string): string {
  const lines: string[] = [
    "Project Matcher — Platform Report",
    `Generated,${generatedAt}`,
    "",
    ...section("Student Statistics", [
      ["Total students", report.students.total],
      ["Active students", report.students.active],
      ["Students in teams", report.students.inTeams],
      ["Students without teams", report.students.withoutTeams],
      ["Incomplete profiles", report.students.incompleteProfiles],
    ]),
    ...section("Project Statistics", [
      ["Total projects", report.projects.total],
      ["Recruiting", report.projects.recruiting],
      ["Active projects", report.projects.active],
      ["Completed", report.projects.completed],
      ["Archived", report.projects.archived],
      ["Projects without teams", report.projects.withoutTeams],
    ]),
    ...section("Team Statistics", [
      ["Total teams", report.teams.total],
      ["Recruiting", report.teams.recruiting],
      ["Complete (full)", report.teams.complete],
      ["Active", report.teams.active],
      ["Completed", report.teams.completed],
      ["Average team size", report.teams.averageSize],
      ["Teams with skill gaps", report.teams.withSkillGaps],
    ]),
    ...section("Matching Statistics", [
      ["Total recommendations", report.matching.recommendations],
      ["Invitations sent", report.matching.invitationsSent],
      ["Accepted", report.matching.accepted],
      ["Rejected", report.matching.rejected],
      ["Match success rate", `${report.matching.successRate}%`],
      ["Average match score", report.matching.averageMatchScore],
    ]),
    ...section(
      "Students by Year",
      report.students.byYear.map((s) => [s.status, s.count] as [string, number])
    ),
    ...section(
      "Students by Program",
      report.students.byProgram.map((s) => [s.status, s.count] as [string, number])
    ),
    ...section(
      "Most Requested Skills",
      report.matching.topRequestedSkills.map((s) => [s.status, s.count] as [string, number])
    ),
    ...section(
      "Most Common Skill Gaps",
      report.matching.topSkillGaps.map((s) => [s.status, s.count] as [string, number])
    ),
  ];
  return lines.join("\n");
}

/** Pretty-printed JSON snapshot of the same bundle. */
export function reportToJSON(report: ReportBundle, generatedAt: string): string {
  return JSON.stringify({ generatedAt, ...report }, null, 2);
}

export function reportFileName(ext: "csv" | "json", now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return `project-matcher-report-${day}.${ext}`;
}

/** Trigger a browser download (client-only; no server round-trip). */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on next tick so slow browsers finish reading the blob first.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
