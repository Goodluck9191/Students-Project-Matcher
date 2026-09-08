"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { PasswordStrength } from "./PasswordStrength";
import {
  mockSignUp,
  validateEmail,
  validatePassword,
  type RegisterInput,
} from "@/lib/services/auth";

const YEAR_OPTIONS = [
  { value: "1", label: "Year 1" },
  { value: "2", label: "Year 2" },
  { value: "3", label: "Year 3" },
  { value: "4", label: "Year 4" },
  { value: "5", label: "Year 5 / Postgraduate" },
];

export function RegisterForm() {
  const { success, error } = useToast();
  const [form, setForm] = React.useState<RegisterInput & { confirmPassword: string }>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    program: "",
    year: "",
  });
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [succeeded, setSucceeded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;
    const passwordError = validatePassword(form.password);
    if (passwordError) next.password = passwordError;
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match.";
    if (!form.university.trim()) next.university = "University is required.";
    if (!form.program.trim()) next.program = "Program / course is required.";
    if (!form.year) next.year = "Year of study is required.";
    if (!acceptedTerms)
      next.terms = "Please accept the terms and conditions to continue.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      const result = await mockSignUp(form);
      if (result.ok) {
        setSucceeded(true);
        success("Account created", result.message);
      } else {
        setFormError(result.message);
        error("Registration failed", result.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (succeeded) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-8 text-center"
      >
        <h2 className="font-semibold text-slate-900">Account created (demo mode)</h2>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500">
          Your next step will be setting up your student profile — skills,
          interests, and availability — arriving in Stage 3.
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
        label="Full name"
        name="fullName"
        autoComplete="name"
        placeholder="Alex Morgan"
        value={form.fullName}
        onChange={(e) => set("fullName", e.target.value)}
        error={fieldErrors.fullName}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@university.edu"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        error={fieldErrors.email}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            error={fieldErrors.password}
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
          <PasswordStrength password={form.password} />
        </div>
        <Input
          label="Confirm password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          error={fieldErrors.confirmPassword}
        />
      </div>
      <Input
        label="University / Institution"
        name="university"
        autoComplete="organization"
        placeholder="Example University"
        value={form.university}
        onChange={(e) => set("university", e.target.value)}
        error={fieldErrors.university}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Program / Course"
          name="program"
          placeholder="Computer Science"
          value={form.program}
          onChange={(e) => set("program", e.target.value)}
          error={fieldErrors.program}
        />
        <Select
          label="Year of study"
          name="year"
          options={YEAR_OPTIONS}
          value={form.year}
          onChange={(e) => set("year", e.target.value)}
          error={fieldErrors.year}
        />
      </div>
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            aria-invalid={Boolean(fieldErrors.terms)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand-600"
          />
          <span>
            I agree to the{" "}
            <a href="/terms" className="font-medium text-brand-700 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="font-medium text-brand-700 hover:underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {fieldErrors.terms && (
          <p role="alert" className="mt-1.5 text-[13px] text-rose-600">
            {fieldErrors.terms}
          </p>
        )}
      </div>
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Create account
      </Button>
    </form>
  );
}
