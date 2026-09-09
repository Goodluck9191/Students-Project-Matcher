"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { getStudentProfileById } from "@/lib/services/students";
import type { StudentProfile } from "@/types";

function PublicProfileView({ profile }: { profile: StudentProfile }) {
  const availability = [
    ...profile.availableDays,
    ...profile.dayTimes,
    ...(profile.workStyle ? [profile.workStyle] : []),
    ...profile.availability,
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar name={profile.fullName || "Student"} src={profile.avatarUrl} size="xl" className="ring-2 ring-slate-200" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {[profile.program, profile.year ? `Year ${profile.year}` : ""].filter(Boolean).join(" • ") || "Student"}
              </p>
              {profile.university && (
                <p className="mt-1 text-sm text-slate-500">{profile.university}</p>
              )}
              {profile.bio && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{profile.bio}</p>
              )}
            </div>
            <Badge variant="info">{profile.experienceLevel}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h3 className="text-[15px] font-semibold text-slate-900">Skills & levels</h3>
            {profile.skills.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No skills listed yet.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <li key={s.skill}>
                    <Badge variant="primary">{s.skill} · {s.level}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mt-5 text-[15px] font-semibold text-slate-900">Interests</h3>
            {profile.interests.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No interests listed yet.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <li key={i}><Badge variant="info">{i}</Badge></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-[15px] font-semibold text-slate-900">Availability</h3>
            {availability.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Not specified.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {availability.map((a) => (
                  <li key={a as string}><Badge variant="outline">{a as string}</Badge></li>
                ))}
              </ul>
            )}
            <h3 className="mt-5 text-[15px] font-semibold text-slate-900">Experience</h3>
            <p className="mt-2 text-sm text-slate-600">
              Level: <span className="font-semibold text-slate-900">{profile.experienceLevel}</span>
            </p>
            {profile.previousExperience && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{profile.previousExperience}</p>
            )}
            {(profile.department || profile.graduationYear) && (
              <p className="mt-3 text-sm text-slate-600">
                {[profile.department, profile.graduationYear && `Class of ${profile.graduationYear}`].filter(Boolean).join(" · ")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Public teammate profile — resolves the REAL student by id in both modes.
 * Email is never shown to viewers.
 */
export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const [state, setState] = React.useState<
    | { kind: "loading" }
    | { kind: "ok"; profile: StudentProfile }
    | { kind: "not-found" }
    | { kind: "unavailable" }
    | { kind: "error" }
  >({ kind: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    getStudentProfileById(params.id)
      .then((res) => {
        if (cancelled) return;
        if (res.status === "ok") setState({ kind: "ok", profile: res.profile });
        else if (res.status === "not-found") setState({ kind: "not-found" });
        else setState({ kind: "unavailable" });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4" role="status" aria-label="Loading profile">
        <PageHeader title="Student Profile" subtitle="Loading…" />
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48 max-w-full" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (state.kind === "not-found") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6">
        <PageHeader title="Student Profile" subtitle="This profile could not be found." />
        <EmptyState
          title="Student not found"
          description="This student doesn't exist or their profile is no longer available."
          actionLabel="Find Teammates"
          actionHref="/matches"
        />
      </div>
    );
  }

  if (state.kind === "unavailable") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6">
        <PageHeader title="Student Profile" subtitle="This profile is currently unavailable." />
        <EmptyState
          title="Profile unavailable"
          description="This account is inactive, so the profile can't be shown."
          actionLabel="Back to Matches"
          actionHref="/matches"
        />
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6">
        <PageHeader title="Student Profile" subtitle="Something went wrong." />
        <ErrorState
          title="Couldn't load this profile"
          description="Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/matches"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Matches
      </Link>
      <PageHeader
        title="Student Profile"
        subtitle="Teammate profile"
        actions={
          <Button href="/matches" variant="outline" size="sm">
            Find Teammates
          </Button>
        }
      />
      <PublicProfileView profile={state.profile} />
    </div>
  );
}
