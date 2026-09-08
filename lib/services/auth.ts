/**
 * Mock authentication service — Stage 2 (frontend demo only).
 *
 * Contract for the future Supabase Auth integration:
 * - UI pages call these functions; they never touch Supabase directly.
 * - Stage 2 implementations validate input and simulate latency only.
 * - They NEVER store passwords, create sessions, or mark anyone as
 *   authenticated. Supabase Auth (`signInWithPassword`, `signUp`,
 *   `resetPasswordForEmail`) will replace the bodies without changing
 *   the function signatures consumed by the UI.
 */

export interface AuthResult {
  ok: boolean;
  message: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  university: string;
  program: string;
  year: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return undefined;
}

export function validateRegister(input: RegisterInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.fullName.trim()) errors.fullName = "Full name is required.";
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;
  if (!input.university.trim()) errors.university = "University is required.";
  if (!input.program.trim()) errors.program = "Program / course is required.";
  if (!input.year) errors.year = "Year of study is required.";
  return errors;
}

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

/** Frontend-only heuristic for the strength meter (not a security check). */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (score <= 2) return "weak";
  if (score === 3) return "fair";
  if (score === 4) return "good";
  return "strong";
}

function delay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock sign-in. TODO (Supabase): replace body with
 * `supabase.auth.signInWithPassword({ email, password })`.
 */
export async function mockSignIn(email: string, password: string): Promise<AuthResult> {
  await delay();
  if (validateEmail(email) || validatePassword(password)) {
    return { ok: false, message: "Please fix the highlighted fields and try again." };
  }
  // Demo account for the university showcase.
  if (email.trim().toLowerCase() === "demo@university.edu" && password === "password123") {
    return { ok: true, message: "Welcome back! Demo sign-in successful." };
  }
  return {
    ok: true,
    message: "Signed in (demo mode — no real session was created).",
  };
}

/**
 * Mock sign-up. TODO (Supabase): replace body with
 * `supabase.auth.signUp({ email, password, options: { data: {...} } })`.
 */
export async function mockSignUp(input: RegisterInput): Promise<AuthResult> {
  await delay(900);
  const errors = validateRegister(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields and try again." };
  }
  return {
    ok: true,
    message: "Account created (demo mode). Continue to profile setup.",
  };
}

/**
 * Mock password-reset request. TODO (Supabase): replace body with
 * `supabase.auth.resetPasswordForEmail(email)`.
 */
export async function mockRequestPasswordReset(email: string): Promise<AuthResult> {
  await delay();
  if (validateEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  return {
    ok: true,
    message:
      "If an account exists with this email, a password reset link has been requested.",
  };
}
