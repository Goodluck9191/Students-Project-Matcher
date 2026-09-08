import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { StudentProfile } from "@/types";
import type { SetupStepId } from "@/lib/services/profile";

function Section({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-brand-700 hover:bg-brand-50"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ProfileReview({
  profile,
  onEditStep,
}: {
  profile: StudentProfile;
  onEditStep: (step: SetupStepId) => void;
}) {
  const availability: string[] = [
    ...profile.availableDays,
    ...profile.dayTimes,
    ...(profile.workStyle ? [profile.workStyle] : []),
  ];

  return (
    <div className="space-y-4">
      <Section title="About" onEdit={() => onEditStep("basic")} editLabel="Edit basic information">
        <p className="text-sm font-semibold text-slate-900">{profile.fullName}</p>
        <p className="mt-0.5 text-sm text-slate-500">
          {[profile.program, profile.year ? `Year ${profile.year}` : ""]
            .filter(Boolean)
            .join(" • ")}
        </p>
        {profile.bio && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{profile.bio}</p>
        )}
      </Section>

      <Section
        title="Academic"
        onEdit={() => onEditStep("academic")}
        editLabel="Edit academic information"
      >
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["University", profile.university],
            ["Program", profile.program],
            ["Year", profile.year ? `Year ${profile.year}` : ""],
            ["Department", profile.department ?? ""],
            ["Graduation", profile.graduationYear ?? ""],
          ].map(
            ([term, value]) =>
              value ? (
                <div key={term} className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs text-slate-500">{term}</dt>
                  <dd className="font-medium text-slate-800">{value}</dd>
                </div>
              ) : null
          )}
        </dl>
      </Section>

      <Section title="Skills" onEdit={() => onEditStep("skills")} editLabel="Edit skills">
        {profile.skills.length === 0 ? (
          <p className="text-sm text-slate-500">No skills selected yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <li key={s.skill}>
                <Badge variant="primary">
                  {s.skill} · {s.level}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Interests"
        onEdit={() => onEditStep("interests")}
        editLabel="Edit interests"
      >
        {profile.interests.length === 0 ? (
          <p className="text-sm text-slate-500">No interests selected yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <li key={i}>
                <Badge variant="info">{i}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Availability & Experience"
        onEdit={() => onEditStep("availability")}
        editLabel="Edit availability and experience"
      >
        {availability.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {availability.map((a) => (
              <li key={a}>
                <Badge variant="outline">{a}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-slate-600">
          Experience:{" "}
          <span className="font-semibold text-slate-900">{profile.experienceLevel}</span>
        </p>
        {profile.previousExperience && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {profile.previousExperience}
          </p>
        )}
      </Section>
    </div>
  );
}
