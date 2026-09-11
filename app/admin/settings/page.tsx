"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { updateOwnEmailAction } from "@/lib/actions/admin";
import {
  loadPersistedProfile,
  persistProfile,
  uploadAvatar,
  type PersistedProfileResult,
} from "@/lib/services/profile";
import type { StudentProfile } from "@/types";
import {
  getAdminSettings,
  getAdminSettingsAsync,
  getMatchingTierCutoffs,
  getMatchingWeights,
  saveAdminSettings,
  type AdminSettings,
} from "@/lib/services/admin";

/** Basic platform controls (mock/local) — shaped for a future settings table. */
export default function AdminSettingsPage() {
  const { success } = useToast();
  const [settings, setSettings] = React.useState<AdminSettings>(() => getAdminSettings());
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getAdminSettingsAsync().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSettings(saveAdminSettings(settings));
    setSaved(true);
    success("Settings saved", "Your changes are saved.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Settings" subtitle="Your account and basic platform controls." />

      <AdminProfileCard />

      <form onSubmit={handleSave}>
        <Card>
          <CardContent className="space-y-4 py-6">
            <Input
              label="Platform name"
              name="platformName"
              value={settings.platformName}
              onChange={(e) => set("platformName", e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Default team size"
                name="defaultTeamSize"
                options={["2", "3", "4", "5", "6", "7", "8"]}
                value={String(settings.defaultTeamSize)}
                onChange={(e) => set("defaultTeamSize", Number(e.target.value))}
              />
              <Input
                label="Minimum match threshold (%)"
                name="minMatchThreshold"
                type="number"
                min={0}
                max={90}
                value={settings.minMatchThreshold}
                onChange={(e) => set("minMatchThreshold", Number(e.target.value))}
                hint="Recommendations below this score are hidden from students."
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => set("notificationsEnabled", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              Enable platform notifications
            </label>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit">{saved ? "Saved ✓" : "Save Settings"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardContent className="py-5">
          <h3 className="font-semibold text-slate-900">Live matching model (read-only)</h3>
          <p className="mt-1 text-[13px] text-slate-500">
            The admin dashboard consumes the existing Stage 6 engine — weights and tiers below are the live values.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dimension weights</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {getMatchingWeights().map((w) => (
                  <li key={w.dimension} className="flex justify-between gap-2">
                    <span className="text-slate-600">{w.dimension}</span>
                    <span className="font-semibold tabular-nums text-slate-900">{w.weight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Match tiers</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {getMatchingTierCutoffs().map((t) => (
                  <li key={t.tier} className="flex justify-between gap-2">
                    <span className="text-slate-600">{t.tier}</span>
                    <span className="font-semibold tabular-nums text-slate-900">{t.min}%+</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * The single admin's own account: profile fields + login email.
 * Profile writes reuse the student save path (whitelisted fields only —
 * role can never change here); the email goes through Supabase Auth so
 * confirmation is honored when the project requires it.
 */
function AdminProfileCard() {
  const { success, error } = useToast();
  const [loaded, setLoaded] = React.useState<PersistedProfileResult | null>(null);
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = React.useState<string | undefined>(undefined);
  const [email, setEmail] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingEmail, setSavingEmail] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    loadPersistedProfile().then((res) => {
      if (cancelled) return;
      setLoaded(res);
      if (res.status === "ok") {
        setProfile(res.profile);
        setEmail(res.profile.email ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!profile.fullName.trim()) {
      error("Couldn't save your profile", "Full name is required.");
      return;
    }
    setSavingProfile(true);
    try {
      let avatarUrl = profile.avatarUrl;
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (!uploaded.ok) {
          error("Photo upload failed", uploaded.error);
          return;
        }
        avatarUrl = uploaded.url;
      }
      const saved = await persistProfile({ ...profile, avatarUrl });
      if (!saved.ok) {
        error("Couldn't save your profile", saved.error);
        return;
      }
      setProfile({ ...profile, avatarUrl });
      setAvatarFile(undefined);
      success("Profile updated", "Your changes are saved.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    try {
      const res = await updateOwnEmailAction(email);
      if (!res.ok) {
        error("Couldn't update the email", res.error);
        return;
      }
      success(
        "Email updated",
        res.data.confirmationRequired
          ? "Check your new inbox to confirm the change before it takes effect for login."
          : "Your login email has been changed."
      );
    } finally {
      setSavingEmail(false);
    }
  }

  if (!loaded) return null;

  if (loaded.status === "mock") {
    return (
      <Card>
        <CardContent className="py-5">
          <h3 className="font-semibold text-slate-900">My Account</h3>
          <p className="mt-1 text-sm text-slate-500">
            Connect Supabase to manage your administrator account (profile and login email).
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loaded.status !== "ok" || !profile) {
    return (
      <Card>
        <CardContent className="py-5">
          <h3 className="font-semibold text-slate-900">My Account</h3>
          <p className="mt-1 text-sm text-slate-500">
            {loaded.status === "unauthenticated"
              ? "Please log in to manage your administrator account."
              : "Your administrator profile could not be loaded. Try refreshing the page."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <div>
          <h3 className="font-semibold text-slate-900">My Account</h3>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Your administrator profile. Your platform role always stays <span className="font-medium">admin</span>.
          </p>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <AvatarUpload
            name={profile.fullName}
            previewUrl={avatarPreview ?? profile.avatarUrl}
            onFileSelect={(file, url) => {
              setAvatarFile(file);
              setAvatarPreview(url);
            }}
          />
          <Input
            label="Full name"
            name="adminFullName"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            autoComplete="name"
          />
          <Textarea
            label="Bio"
            name="adminBio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
        <form onSubmit={handleEmailSave} className="space-y-4 border-t border-slate-100 pt-5">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Login email</h4>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Changing your email updates your Supabase Auth login. If confirmation is required, check your new inbox.
            </p>
          </div>
          <Input
            label="Email"
            name="adminEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <div className="flex justify-end">
            <Button type="submit" variant="outline" loading={savingEmail}>
              Update Email
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
