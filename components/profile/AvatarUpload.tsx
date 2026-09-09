"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Profile photo picker. Shows an instant local preview and hands the raw
 * File to the caller, which uploads it to the `avatars` Storage bucket on
 * save (Supabase mode) and persists the public URL. Blob previews never
 * reach the database — the save action only accepts http(s) URLs.
 *
 * The preview prefers a newly picked file, falling back to `previewUrl`
 * (e.g. the stored avatar_url arriving after mount). Parents remount via
 * `key` to discard a picked file (cancel flows).
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
  const [pickedUrl, setPickedUrl] = React.useState<string | undefined>(undefined);
  const shown = pickedUrl ?? previewUrl;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPickedUrl(undefined);
      onFileSelect(undefined, undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPickedUrl(url);
    onFileSelect(file, url);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar
        name={name || "Student"}
        src={shown}
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
          {shown ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-1.5 text-xs text-slate-500">
          JPG or PNG, up to 5 MB. Saved with your profile.
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
