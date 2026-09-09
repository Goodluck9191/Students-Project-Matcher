"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { updatePasswordAction } from "@/lib/actions/auth";

export function ResetPasswordForm() {
  const { success, error } = useToast();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [fieldError, setFieldError] = React.useState<string | undefined>();
  const [done, setDone] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }
    if (confirm !== password) {
      setFieldError("Passwords do not match.");
      return;
    }
    setFieldError(undefined);
    setLoading(true);
    try {
      const res = await updatePasswordAction(password);
      if (res.ok) {
        setDone(true);
        success("Password updated", "You can now log in with your new password.");
      } else {
        setFieldError(res.error);
        error("Couldn't update the password", res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-8 text-center">
        <h2 className="font-semibold text-slate-900">Password updated</h2>
        <div className="mt-5">
          <Button href="/login">Back to login</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="New password"
        name="new-password"
        type={show ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Min. 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldError}
        rightElement={
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      <Input
        label="Confirm new password"
        name="confirm-password"
        type={show ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Repeat password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Update password
      </Button>
    </form>
  );
}
