"use client";

import * as React from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  AvatarUpload,
  ProfileHeader,
  SkillSelector,
  SkillLevelSelector,
  InterestSelector,
  AvailabilitySelector,
  ExperienceSelector,
} from "@/components/profile";
import { PROGRAM_OPTIONS, type StudentProfile } from "@/types";
import { mockProfile } from "@/lib/mock/profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  computeCompletion,
  loadPersistedProfile,
  persistProfile,
  uploadAvatar,
  validateComplete,
  type ProfileErrors,
} from "@/lib/services/profile";

const YEAR_OPTIONS = ["1", "2", "3", "4", "5"].map((y) => ({
  value: y,
  label: `Year ${y}`,
}));

/**
 * Own profile: display mode + edit mode reusing the exact selector
 * components from the setup wizard (no duplicated forms).
 */
export default function OwnProfilePage() {
  const { success, error } = useToast();
  // Supabase mode never seeds state from mock data: null = still loading,
  // and every load outcome below replaces it explicitly.
  const configured = isSupabaseConfigured();
  const [profile, setProfile] = React.useState<StudentProfile | null>(
    configured ? null : mockProfile
  );
  const [draft, setDraft] = React.useState<StudentProfile>(mockProfile);
  const [errors, setErrors] = React.useState<ProfileErrors>({});
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [missing, setMissing] = React.useState<"setup" | "login" | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [avatarFile, setAvatarFile] = React.useState<File | undefined>(undefined);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    loadPersistedProfile().then((res) => {
      if (cancelled) return;
      if (res.status === "ok") {
        setProfile(res.profile);
        setDraft(res.profile);
      } else if (res.status === "missing") {
        setMissing("setup");
      } else if (res.status === "unauthenticated") {
        setMissing("login");
      } else if (res.status === "error") {
        setLoadError(res.error);
      }
      // "mock" is unreachable here (guarded above); fixtures stay as-is.
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Non-null once past the loading/missing/error guards below
  // (mock mode always has the fixture).
  const activeProfile = profile ?? mockProfile;

  function startEdit() {
    setDraft(activeProfile);
    setErrors({});
    setAvatarFile(undefined);
    setEditing(true);
  }

  function cancelEdit() {
    setAvatarFile(undefined);
    setErrors({});
    setEditing(false);
  }

  async function handleSave() {
    const validation = validateComplete(draft);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      error("Profile incomplete", "Please fix the highlighted fields.");
      return;
    }
    const updated = {
      ...draft,
      profileCompletion: computeCompletion(draft),
      updatedAt: new Date().toISOString(),
    };
    setSaving(true);
    try {
      let finalDraft = updated;
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (!uploaded.ok) {
          error("Photo upload failed", uploaded.error);
          return;
        }
        finalDraft = { ...updated, avatarUrl: uploaded.url };
      }
      const saved = await persistProfile(finalDraft);
      if (!saved.ok) {
        error("Couldn't save your profile", saved.error);
        return;
      }
      setProfile(finalDraft);
      setAvatarFile(undefined);
      setEditing(false);
      success("Profile updated", "Your changes are saved.");
    } finally {
      setSaving(false);
    }
  }

  // (mock mode always has the fixture; configured mode returns below
  // unless `profile` loaded — `activeProfile` above covers both).
  if (configured && loadError && !profile) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Profile" subtitle="How teammates and matching see you." />
        <ErrorState
          title="Couldn't load your profile"
          description={loadError}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (configured && !profile) {
    if (missing) {
      return (
        <div className="space-y-4">
          <PageHeader title="My Profile" subtitle="How teammates and matching see you." />
          <EmptyState
            title={missing === "login" ? "Please log in" : "No profile yet"}
            description={
              missing === "login"
                ? "Log in to view your real Supabase profile."
                : "Complete profile setup to create your real Supabase profile."
            }
            actionLabel={missing === "login" ? "Log in" : "Set up profile"}
            actionHref={missing === "login" ? "/login" : "/profile/setup"}
          />
        </div>
      );
    }
    return (
      <div className="space-y-4" role="status" aria-label="Loading profile">
        <PageHeader title="My Profile" subtitle="How teammates and matching see you." />
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

  if (!editing) {
    const active = activeProfile;
    return (
      <div className="space-y-4">
        <PageHeader
          title="My Profile"
          subtitle="How teammates and matching see you."
          actions={
            <Button variant="outline" size="sm" onClick={startEdit}>
              Edit Profile
            </Button>
          }
        />
        <ProfileHeader profile={active} email={active.email} showEdit={false} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent>
              <h3 className="text-[15px] font-semibold text-slate-900">Skills & levels</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {active.skills.map((s) => (
                  <li key={s.skill}>
                    <Badge variant="primary">
                      {s.skill} · {s.level}
                    </Badge>
                  </li>
                ))}
              </ul>
              <h3 className="mt-5 text-[15px] font-semibold text-slate-900">Interests</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {active.interests.map((i) => (
                  <li key={i}>
                    <Badge variant="info">{i}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h3 className="text-[15px] font-semibold text-slate-900">Availability</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {[...active.availableDays, ...active.dayTimes, active.workStyle]
                  .filter(Boolean)
                  .map((a) => (
                    <li key={a as string}>
                      <Badge variant="outline">{a as string}</Badge>
                    </li>
                  ))}
              </ul>
              <h3 className="mt-5 text-[15px] font-semibold text-slate-900">Experience</h3>
              <p className="mt-2 text-sm text-slate-600">
                Level:{" "}
                <span className="font-semibold text-slate-900">
                  {active.experienceLevel}
                </span>
              </p>
              {active.previousExperience && (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {active.previousExperience}
                </p>
              )}
              {(active.department || active.graduationYear) && (
                <>
                  <h3 className="mt-5 text-[15px] font-semibold text-slate-900">
                    Academic details
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {[active.department, active.graduationYear && `Class of ${active.graduationYear}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Profile"
        subtitle="Changes save to your account immediately."
        actions={
          <Button variant="ghost" size="sm" onClick={cancelEdit}>
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        }
      />
      <Card className="mt-5">
        <CardContent className="space-y-6 py-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-900">Basic information</h3>
            <div className="mt-3 space-y-4">
              <AvatarUpload
                name={draft.fullName}
                previewUrl={draft.avatarUrl}
                onFileSelect={(file, url) => {
                  setAvatarFile(file);
                  setDraft({ ...draft, avatarUrl: url });
                }}
              />
              <Input
                label="Full name"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                error={errors.fullName}
              />
              <Textarea
                label="Bio"
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value.slice(0, 500) })}
                error={errors.bio}
                rows={3}
              />
            </div>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Academic information</h3>
            <div className="mt-3 space-y-4">
              <Input
                label="University"
                value={draft.university}
                onChange={(e) => setDraft({ ...draft, university: e.target.value })}
                error={errors.university}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-program"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Program
                  </label>
                  <select
                    id="edit-program"
                    value={draft.program}
                    onChange={(e) => setDraft({ ...draft, program: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Select program…</option>
                    {PROGRAM_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.program && (
                    <p role="alert" className="mt-1.5 text-[13px] text-rose-600">
                      {errors.program}
                    </p>
                  )}
                </div>
                <Select
                  label="Year of study"
                  options={YEAR_OPTIONS}
                  value={draft.year ? String(draft.year) : ""}
                  onChange={(e) =>
                    setDraft({ ...draft, year: Number(e.target.value) || 0 })
                  }
                  error={errors.year}
                />
              </div>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <SkillSelector
              selected={draft.skills.map((s) => s.skill)}
              onChange={(names) =>
                setDraft({
                  ...draft,
                  skills: names.map(
                    (name) =>
                      draft.skills.find((s) => s.skill === name) ?? {
                        skill: name,
                        level: "Intermediate" as const,
                      }
                  ),
                })
              }
              error={errors.skills}
            />
            <SkillLevelSelector
              skills={draft.skills}
              onChange={(skills) => setDraft({ ...draft, skills })}
            />
          </section>

          <section className="border-t border-slate-100 pt-6">
            <InterestSelector
              selected={draft.interests}
              onChange={(interests) => setDraft({ ...draft, interests })}
              error={errors.interests}
            />
          </section>

          <section className="border-t border-slate-100 pt-6">
            <AvailabilitySelector
              days={draft.availableDays}
              times={draft.dayTimes}
              workStyle={draft.workStyle}
              onDaysChange={(availableDays) => setDraft({ ...draft, availableDays })}
              onTimesChange={(dayTimes) => setDraft({ ...draft, dayTimes })}
              onWorkStyleChange={(workStyle) => setDraft({ ...draft, workStyle })}
              error={errors.availability}
              workStyleError={errors.workStyle}
            />
          </section>

          <section className="border-t border-slate-100 pt-6">
            <ExperienceSelector
              level={draft.experienceLevel}
              onLevelChange={(experienceLevel) => setDraft({ ...draft, experienceLevel })}
              previousExperience={draft.previousExperience ?? ""}
              onPreviousExperienceChange={(previousExperience) =>
                setDraft({ ...draft, previousExperience })
              }
            />
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={cancelEdit} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
              <Check className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
