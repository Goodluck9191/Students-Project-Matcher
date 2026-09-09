import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/session";

/**
 * Next 16 Proxy (replaces deprecated middleware): keeps the Supabase
 * session synchronized. AuthZ itself lives in Server Actions/services
 * + RLS — never trust proxy alone (see docs: verify inside each
 * Server Function).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
