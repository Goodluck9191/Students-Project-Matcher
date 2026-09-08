"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { mockRequestPasswordReset, validateEmail } from "@/lib/services/auth";

export function ForgotPasswordForm() {
  const { success } = useToast();
  const [email, setEmail] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | undefined>();
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateEmail(email);
    setFieldError(validationError);
    if (validationError) return;
    setLoading(true);
    try {
      const result = await mockRequestPasswordReset(email);
      if (result.ok) {
        setSent(true);
        success("Request received", result.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-8 text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-semibold text-slate-900">Check your inbox</h2>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500">
          If an account exists with this email, a password reset link has been
          requested.
        </p>
        <div className="mt-5">
          <Button href="/login" variant="outline">
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@university.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldError}
        leftIcon={<Mail className="h-4 w-4" />}
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Send reset link
      </Button>
      <p className="text-center text-sm text-slate-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
