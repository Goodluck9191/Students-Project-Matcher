"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  AvatarUpload,
  SkillSelector,
  SkillLevelSelector,
  InterestSelector,
  AvailabilitySelector,
  ExperienceSelector,
  ProfileCompletion,
  ProfileReview,
  SetupSteps,
} from "@/components/profile";
import {
  PROGRAM_OPTIONS,
  type AvailabilitySlot,
  type StudentProfile,
} from "@/types";
import {
  SETUP_STEPS,
  clearDraft,
  computeCompletion,
  loadDraft,
  loadPersistedProfile,
  persistProfile,
  saveDraft,
  uploadAvatar,
  validateStep,
  type ProfileErrors,
  type SetupStepId,
} from "@/lib/services/profile";

const YEAR_OPTIONS = ["1", "2", "3", "4", "5"].map((y) => ({
  value: y,
  label: `Year ${y}`,
}));

const BIO_LIMIT = 500;

/** Keep the legacy `availability` tags in sync for the future matching engine. */
function deriveAvailabilitySlots(draft: StudentProfile): AvailabilitySlot[] {
  const slots = new Set<AvailabilitySlot>();
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  if (draft.availableDays.some((d) => weekdays.includes(d))) slots.add("Weekdays");
  if (draft.availableDays.some((d) => d === "Saturday" || d === "Sunday"))
    slots.add("Weekends");
  if (draft.dayTimes.includes("Morning")) slots.add("Morning");
  if (draft.dayTimes.includes("Afternoon")) slots.add("Afternoon");
  if (draft.dayTimes.includes("Evening") || draft.dayTimes.includes("Night"))
    slots.add("Evening");
  return [...slots];
}

export default function ProfileSetupPage() {
  const { success, error: toastError } = useToast();
  const [draft, setDraft] = React.useState<StudentProfile>(() => emptyInitial());
  const [hydrated, setHydrated] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [maxReached, setMaxReached] = React.useState(0);
  const [errors, setErrors] = React.useState<ProfileErrors>({});
  const [finished, setFinished] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  // Raw photo file pending upload (preview URL lives in draft.avatarUrl).
  const [avatarFile, setAvatarFile] = React.useState<File | undefined>(undefined);

  function emptyInitial(): StudentProfile {
    // SSR-safe initial; real draft loads on mount.
    return {
      id: "me",
      fullName: "",
      bio: "",
      university: "Mbeya University of Science and Technology",
      department: "",
      program: "",
      year: 0,
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

  // Mount-only load: localStorage is unavailable during SSR, so the
  // persisted draft must be read into state once after hydration.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadPersistedProfile();
      if (cancelled) return;
      // Only a real saved row pre-fills the wizard; every other outcome
      // ("mock" included) starts from the local draft — never mock data.
      setDraft(saved.status === "ok" ? saved.profile : loadDraft());
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  const step = SETUP_STEPS[stepIndex];
  const completion = computeCompletion(draft);

  function patch(p: Partial<StudentProfile>) {
    setDraft((prev) => {
      const next = { ...prev, ...p };
      return { ...next, availability: deriveAvailabilitySlots(next) };
    });
  }

  function goToStep(id: SetupStepId) {
    const i = SETUP_STEPS.findIndex((s) => s.id === id);
    if (i <= maxReached) {
      setStepIndex(i);
      setErrors({});
    }
  }

  function handleNext() {
    const validation = validateStep(step.id, draft);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    if (step.id === "review") {
      handleFinish();
      return;
    }
    const next = Math.min(stepIndex + 1, SETUP_STEPS.length - 1);
    setStepIndex(next);
    setMaxReached((m) => Math.max(m, next));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
    setErrors({});
  }

  async function handleFinish() {
    const all = validateStep("review", draft);
    setErrors(all);
    if (Object.keys(all).length > 0) {
      // Jump to the first incomplete step.
      const firstBad = SETUP_STEPS.find(
        (s) => s.id !== "review" && Object.keys(validateStep(s.id, draft)).length > 0
      );
      if (firstBad) {
        setStepIndex(SETUP_STEPS.findIndex((s) => s.id === firstBad.id));
      }
      return;
    }
    const done = {
      ...draft,
      availability: deriveAvailabilitySlots(draft),
      profileCompletion: computeCompletion({ ...draft, availability: deriveAvailabilitySlots(draft) }),
      updatedAt: new Date().toISOString(),
    };
    setDraft(done);
    saveDraft(done);
    setSaving(true);
    try {
      // Upload a newly picked photo first so the persisted avatar_url is a
      // permanent public URL — blob: previews are never stored.
      let finalDraft = done;
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (!uploaded.ok) {
          toastError("Photo upload failed", uploaded.error);
          return;
        }
        finalDraft = { ...done, avatarUrl: uploaded.url };
        setDraft(finalDraft);
      }
      const saved = await persistProfile(finalDraft);
      if (!saved.ok) {
        toastError("Couldn't save your profile", saved.error);
        return;
      }
    } finally {
      setSaving(false);
    }
    clearDraft();
    setAvatarFile(undefined);
    setFinished(true);
    success("Profile complete", "Your profile is ready for matching.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-lg py-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
          <PartyPopper className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Profile Complete!</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-slate-500">
          Your profile is ready. We&apos;ll use your skills, interests,
          availability, and experience to find suitable project teammates.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Button href="/dashboard" size="lg">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/profile" variant="outline" size="lg">
            View my profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Profile Setup"
        subtitle="Build your student profile so we can match you with the right teammates."
      />

      <Card className="mt-5">
        <CardContent className="pt-5">
          <SetupSteps
            current={step.id}
            onGoTo={goToStep}
            maxReachable={maxReached}
          />
          <div className="mt-4 border-t border-slate-100 pt-4">
            <ProfileCompletion value={completion} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="py-6">
          <h2 className="text-lg font-bold text-slate-900">
            Step {stepIndex + 1}: {step.title}
          </h2>

          <div className="mt-5">
            {step.id === "basic" && (
              <div className="space-y-4">
                <AvatarUpload
                  name={draft.fullName}
                  previewUrl={draft.avatarUrl}
                  onFileSelect={(file, url) => {
                    setAvatarFile(file);
                    patch({ avatarUrl: url });
                  }}
                />
                <Input
                  label="Full name"
                  name="fullName"
                  autoComplete="name"
                  placeholder="John Michael"
                  value={draft.fullName}
                  onChange={(e) => patch({ fullName: e.target.value })}
                  error={errors.fullName}
                />
                <div>
                  <Textarea
                    label="Bio"
                    name="bio"
                    placeholder="Frontend developer interested in building modern web applications."
                    value={draft.bio}
                    onChange={(e) => patch({ bio: e.target.value.slice(0, BIO_LIMIT) })}
                    error={errors.bio}
                    rows={4}
                  />
                  <p className="mt-1 text-right text-xs text-slate-400" aria-live="polite">
                    {draft.bio.length}/{BIO_LIMIT}
                  </p>
                </div>
              </div>
            )}

            {step.id === "academic" && (
              <div className="space-y-4">
                <Input
                  label="University"
                  name="university"
                  autoComplete="organization"
                  placeholder="Mbeya University of Science and Technology"
                  value={draft.university}
                  onChange={(e) => patch({ university: e.target.value })}
                  error={errors.university}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="program"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Program
                    </label>
                    <select
                      id="program"
                      value={PROGRAM_OPTIONS.includes(
                        draft.program as (typeof PROGRAM_OPTIONS)[number]
                      ) ? draft.program : draft.program ? "__other" : ""}
                      onChange={(e) =>
                        patch({
                          program: e.target.value === "__other" ? "" : e.target.value,
                        })
                      }
                      aria-invalid={Boolean(errors.program)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="">Select program…</option>
                      {PROGRAM_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      <option value="__other">Other (type below)</option>
                    </select>
                    {(!PROGRAM_OPTIONS.includes(
                      draft.program as (typeof PROGRAM_OPTIONS)[number]
                    ) || errors.program) && (
                      <Input
                        name="programOther"
                        aria-label="Program name"
                        placeholder="Type your program"
                        value={
                          draft.program === "__other" ? "" : draft.program
                        }
                        onChange={(e) => patch({ program: e.target.value })}
                        error={errors.program}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <Select
                    label="Year of study"
                    name="year"
                    options={YEAR_OPTIONS}
                    value={draft.year ? String(draft.year) : ""}
                    onChange={(e) => patch({ year: Number(e.target.value) || 0 })}
                    error={errors.year}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Department (optional)"
                    name="department"
                    placeholder="e.g. Computer Science and Engineering"
                    value={draft.department ?? ""}
                    onChange={(e) => patch({ department: e.target.value })}
                  />
                  <Input
                    label="Graduation year (optional)"
                    name="graduationYear"
                    inputMode="numeric"
                    placeholder="e.g. 2028"
                    value={draft.graduationYear ?? ""}
                    onChange={(e) => patch({ graduationYear: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step.id === "skills" && (
              <div>
                <SkillSelector
                  selected={draft.skills.map((s) => s.skill)}
                  onChange={(names) =>
                    patch({
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
                  onChange={(skills) => patch({ skills })}
                />
              </div>
            )}

            {step.id === "interests" && (
              <InterestSelector
                selected={draft.interests}
                onChange={(interests) => patch({ interests })}
                error={errors.interests}
              />
            )}

            {step.id === "availability" && (
              <div className="space-y-6">
                <AvailabilitySelector
                  days={draft.availableDays}
                  times={draft.dayTimes}
                  workStyle={draft.workStyle}
                  onDaysChange={(availableDays) => patch({ availableDays })}
                  onTimesChange={(dayTimes) => patch({ dayTimes })}
                  onWorkStyleChange={(workStyle) => patch({ workStyle })}
                  error={errors.availability}
                  workStyleError={errors.workStyle}
                />
                <div className="border-t border-slate-100 pt-6">
                  <ExperienceSelector
                    level={draft.experienceLevel}
                    onLevelChange={(experienceLevel) => patch({ experienceLevel })}
                    previousExperience={draft.previousExperience ?? ""}
                    onPreviousExperienceChange={(previousExperience) =>
                      patch({ previousExperience })
                    }
                  />
                </div>
              </div>
            )}

            {step.id === "review" && (
              <ProfileReview profile={draft} onEditStep={goToStep} />
            )}
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step.id === "review" ? (
              <Button onClick={handleFinish} loading={saving} className="w-full sm:w-auto" size="lg">
                <CheckCircle2 className="h-4 w-4" /> Complete Profile
              </Button>
            ) : (
              <Button onClick={handleNext} className="w-full sm:w-auto">
                {stepIndex === SETUP_STEPS.length - 2 ? "Review Profile" : "Save & Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-slate-400">
        Your progress saves automatically in this browser (demo mode).{" "}
        <Link href="/dashboard" className="font-medium text-brand-700 hover:underline">
          Skip for now
        </Link>
      </p>
    </div>
  );
}
