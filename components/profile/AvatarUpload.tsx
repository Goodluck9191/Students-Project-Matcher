"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Mock avatar upload — preview only.
 * TODO (Supabase Storage): upload to the `avatars` bucket on save and
 * persist the public URL as `avatar_url`. The object URL below never
 * leaves the browser.
 */
export function AvatarUpload({
  name,
  previewUrl,
  onFileSelect,
}: {
  name: string;
  previewUrl?: string;
  onFileSelect: (file: File | undefined, previewUrl: string | undefined) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = React.useState<string | undefined>(previewUrl);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      onFileSelect(undefined, undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onFileSelect(file, url);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar
        name={name || "Student"}
        src={localPreview}
        size="xl"
        className="ring-2 ring-slate-200"
      />
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-50 px-3.5 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
        >
          <Camera className="h-4 w-4" aria-hidden />
          {localPreview ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-1.5 text-xs text-slate-500">
          JPG or PNG. Preview only in demo mode.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          aria-label="Upload profile photo"
          className="sr-only"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
