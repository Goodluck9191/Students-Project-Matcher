"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  getAdminSettings,
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

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSettings(saveAdminSettings(settings));
    setSaved(true);
    success("Settings saved", "Stored locally in demo mode.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Settings" subtitle="Basic platform controls (demo values, stored locally)." />

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
