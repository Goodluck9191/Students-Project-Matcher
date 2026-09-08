import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { StudentProfile } from "@/types";
import { ProfileCompletion } from "./ProfileCompletion";

export function ProfileHeader({
  profile,
  showEdit = false,
}: {
  profile: StudentProfile;
  showEdit?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar
          name={profile.fullName || "Student"}
          src={profile.avatarUrl}
          size="xl"
          className="ring-2 ring-slate-200"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
            <Badge variant="info">{profile.experienceLevel}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {profile.program}
            {profile.year ? ` · Year ${profile.year}` : ""}
          </p>
          {profile.university && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {profile.university}
            </p>
          )}
          {profile.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              {profile.bio}
            </p>
          )}
        </div>
        {showEdit && (
          <Button href="/profile/setup" variant="outline" size="sm" className="shrink-0">
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        )}
      </div>
      <ProfileCompletion value={profile.profileCompletion} className="mt-5 max-w-md" />
      <p className="mt-3 text-xs text-slate-400">
        Demo profile — Supabase persistence lands later.{" "}
        <Link href="/profile/setup" className="font-medium text-brand-700 hover:underline">
          Finish setup
        </Link>
      </p>
    </div>
  );
}
