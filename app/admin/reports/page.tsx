"use client";

import * as React from "react";
import { Download, FileJson } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { AdminReportCard } from "@/components/admin/AdminStates";
import { HBarChart } from "@/components/admin/AdminChart";
import { AdminLoadingState } from "@/components/admin/AdminStates";
import { getReports, type ReportBundle } from "@/lib/services/admin";
import { downloadFile, reportFileName, reportToCSV, reportToJSON } from "@/lib/reports/export";

function pct(n: number): string {
  return `${n}%`;
}

export default function AdminReportsPage() {
  const [report, setReport] = React.useState<ReportBundle | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getReports()
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" subtitle="Higher-level platform analytics." />
        <ErrorState title="Couldn't load reports" description="Something went wrong. Please try again." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!report) return <AdminLoadingState />;

  const generatedAt = new Date().toISOString();

  function handleDownload(kind: "csv" | "json") {
    if (!report) return;
    if (kind === "csv") {
      downloadFile(reportFileName("csv"), reportToCSV(report, generatedAt), "text/csv");
    } else {
      downloadFile(reportFileName("json"), reportToJSON(report, generatedAt), "application/json");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Higher-level platform analytics, all derived from live mock state."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleDownload("csv")} aria-label="Download report as CSV">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload("json")} aria-label="Download report as JSON">
              <FileJson className="h-4 w-4" /> JSON
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <AdminReportCard
          title="Student Statistics"
          rows={[
            { label: "Total students", value: report.students.total },
            { label: "Active students", value: report.students.active },
            { label: "Students in teams", value: report.students.inTeams },
            { label: "Students without teams", value: report.students.withoutTeams },
            { label: "Incomplete profiles", value: report.students.incompleteProfiles },
          ]}
        />
        <AdminReportCard
          title="Project Statistics"
          rows={[
            { label: "Total projects", value: report.projects.total },
            { label: "Recruiting", value: report.projects.recruiting },
            { label: "Active projects", value: report.projects.active },
            { label: "Completed", value: report.projects.completed },
            { label: "Archived", value: report.projects.archived },
            { label: "Projects without teams", value: report.projects.withoutTeams },
          ]}
        />
        <AdminReportCard
          title="Team Statistics"
          rows={[
            { label: "Total teams", value: report.teams.total },
            { label: "Recruiting", value: report.teams.recruiting },
            { label: "Complete (full)", value: report.teams.complete },
            { label: "Active", value: report.teams.active },
            { label: "Completed", value: report.teams.completed },
            { label: "Average team size", value: report.teams.averageSize },
            { label: "Teams with skill gaps", value: report.teams.withSkillGaps },
          ]}
        />
        <AdminReportCard
          title="Matching Statistics"
          rows={[
            { label: "Total recommendations", value: report.matching.recommendations },
            { label: "Invitations sent", value: report.matching.invitationsSent },
            { label: "Accepted", value: report.matching.accepted },
            { label: "Rejected", value: report.matching.rejected },
            { label: "Match success rate", value: pct(report.matching.successRate) },
            { label: "Average match score", value: report.matching.averageMatchScore },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HBarChart title="Students by Year" data={report.students.byYear} barClassName="bg-cyan-500" />
        <HBarChart title="Most Requested Skills" subtitle="Across project requirements" data={report.matching.topRequestedSkills} />
        <HBarChart title="Most Common Skill Gaps" subtitle="Missing or thinly covered, by team" data={report.matching.topSkillGaps} barClassName="bg-amber-500" />
        <HBarChart title="Students by Program" data={report.students.byProgram.slice(0, 6)} barClassName="bg-emerald-500" />
      </div>
    </div>
  );
}
