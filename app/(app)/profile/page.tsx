"use client";

import * as React from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { PROGRAM_OPTIONS } from "@/types";
import { mockProfile } from "@/lib/mock/profile";
import {
  computeCompletion,
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
  const [profile, setProfile] = React.useState(mockProfile);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(mockProfile);
  const [errors, setErrors] = React.useState<ProfileErrors>({});

  function startEdit() {
    setDraft(profile);
    setErrors({});
    setEditing(true);
  }

  function handleSave() {
    const validation = validateComplete(draft);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      error("Profile incomplete", "Please fix the highlighted fields.");
      return;
    }
    setProfile({
      ...draft,
      profileCompletion: computeCompletion(draft),
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
    success("Profile updated", "Your changes are saved (demo mode).");
  }

  if (!editing) {
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
        <ProfileHeader profile={profile} showEdit={false} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent>
              <h3 className="text-[15px] font-semibold text-slate-900">Skills & levels</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <li key={s.skill}>
                    <Badge variant="primary">
                      {s.skill} · {s.level}
                    </Badge>
                  </li>
                ))}
              </ul>
              <h3 className="mt-5 text-[15px] font-semibold text-slate-900">Interests</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((i) => (
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
                {[...profile.availableDays, ...profile.dayTimes, profile.workStyle]
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
                  {profile.experienceLevel}
                </span>
              </p>
              {profile.previousExperience && (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {profile.previousExperience}
                </p>
              )}
              {(profile.department || profile.graduationYear) && (
                <>
                  <h3 className="mt-5 text-[15px] font-semibold text-slate-900">
                    Academic details
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {[profile.department, profile.graduationYear && `Class of ${profile.graduationYear}`]
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
        subtitle="Changes save locally in demo mode."
        actions={
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
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
                onFileSelect={(_, url) => setDraft({ ...draft, avatarUrl: url })}
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
            <Button variant="outline" onClick={() => setEditing(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Check className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
