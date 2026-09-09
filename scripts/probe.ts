/**
 * Probe: can this machine reach Supabase Auth? Prints only booleans/counts.
 * Usage: node --loader ./scripts/ts-resolve-loader.mjs scripts/probe.ts
 * (reads .env.local locally; never prints secrets)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of [".env.local", ".env"]) {
    const p = join(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
console.log("ENV_PRESENT", JSON.stringify({ url: url.length > 0, anon: anon.length > 0 }));
if (!url || !anon) process.exit(0);

const supabase = createClient(url, anon);
const stamp = Date.now().toString(36);
try {
  const { data, error } = await supabase.auth.signUp({
    email: `probe-${stamp}@projectmatcher.edu`,
    password: "Probe12345!",
  });
  console.log("SIGNUP_OK", JSON.stringify({ hasUser: Boolean(data.user), hasSession: Boolean(data.session) }));
  if (error) console.log("SIGNUP_ERR", error.message);
  if (data.session) {
    const { data: rows, error: rlsErr } = await supabase.from("profiles").select("id").limit(1);
    console.log("PROFILES_READ_OK", JSON.stringify({ rows: rows?.length ?? 0, error: rlsErr?.message ?? null }));
    // Cleanup: delete own auth user is not allowed via anon; report id for manual cleanup.
    console.log("PROBE_USER_ID", data.user?.id ?? null);
    await supabase.auth.signOut();
  } else {
    console.log("NOTE", "email confirmation likely required — live session tests need a confirmed user");
  }
} catch (e) {
  console.log("NETWORK_FAIL", e instanceof Error ? e.message : String(e));
}
