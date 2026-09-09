"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { mockSignIn, validateEmail, validatePassword } from "@/lib/services/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function LoginForm() {
  const router = useRouter();
  const { success, error } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [succeeded, setSucceeded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = { email: validateEmail(email), password: validatePassword(password) };
    const next: typeof fieldErrors = {};
    if (errors.email) next.email = errors.email;
    if (errors.password) next.password = errors.password;
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      // Supabase mode: real session + role-based landing. Mock mode: demo flow.
      const { signInAction } = await import("@/lib/actions/auth");
      const real = await signInAction(email, password);
      if (!real.ok && real.error.includes("not configured")) {
        const result = await mockSignIn(email, password);
        if (result.ok) {
          setSucceeded(true);
          success("Signed in", result.message);
        } else {
          setFormError(result.message);
          error("Sign-in failed", result.message);
        }
        return;
      }
      if (real.ok) {
        success("Signed in", "Welcome back!");
        const next = new URLSearchParams(window.location.search).get("next");
        const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
        router.push(safeNext ?? (real.role === "admin" ? "/admin" : "/dashboard"));
        router.refresh();
        return;
      }
      setFormError(real.error);
      error("Sign-in failed", real.error);
    } finally {
      setLoading(false);
    }
    void remember;
  }

  if (succeeded) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-8 text-center"
      >
        <h2 className="font-semibold text-slate-900">You&apos;re signed in (demo mode)</h2>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500">
          No real session was created — Supabase Auth will replace this mock
          flow. Preview the app shell in the meantime.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button href="/dashboard">Preview dashboard</Button>
          <Button href="/" variant="outline">
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {formError}
        </p>
      )}
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@university.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        leftIcon={<Mail className="h-4 w-4" />}
      />
      <div>
        <Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          leftIcon={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Log in
      </Button>
      {!isSupabaseConfigured() && (
        <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
          Demo hint: sign in with <span className="font-semibold">demo@university.edu</span> /{" "}
          <span className="font-semibold">password123</span>. Nothing leaves your browser.
        </p>
      )}
    </form>
  );
}
