/**
 * Test-only ESM loader: resolves extensionless relative imports and the
 * `@/` path alias to their `.ts` sources so `npm run test:matching` can
 * execute the pure matching engine with plain Node (no test framework).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * Next.js runtime modules (next/headers, next/navigation) only exist
 * inside the Next runtime. Unit tests never call into them (all Supabase
 * branches are mock-gated), so stub the named exports they use.
 */
const NEXT_STUBS = {
  "next/headers":
    "export async function cookies(){ throw new Error('next/headers is unavailable outside Next.js'); }" +
    "export async function headers(){ throw new Error('next/headers is unavailable outside Next.js'); }",
  "next/navigation":
    "export function redirect(){ throw new Error('next/navigation is unavailable outside Next.js'); }" +
    "export function notFound(){ throw new Error('next/navigation is unavailable outside Next.js'); }" +
    "export function useRouter(){ throw new Error('next/navigation is unavailable outside Next.js'); }" +
    "export function useParams(){ throw new Error('next/navigation is unavailable outside Next.js'); }" +
    "export function usePathname(){ throw new Error('next/navigation is unavailable outside Next.js'); }" +
    "export function useSearchParams(){ throw new Error('next/navigation is unavailable outside Next.js'); }",
};

export async function resolve(specifier, context, next) {
  if (specifier in NEXT_STUBS) {
    return {
      url: `data:text/javascript,${encodeURIComponent(NEXT_STUBS[specifier])}`,
      shortCircuit: true,
    };
  }
  let rewritten = specifier;
  if (rewritten.startsWith("@/")) {
    rewritten = path
      .relative(
        path.dirname(fileURLToPath(context.parentURL)),
        path.join(ROOT, rewritten.slice(2))
      )
      .replace(/\\/g, "/");
    if (!rewritten.startsWith(".")) rewritten = `./${rewritten}`;
  }
  if (rewritten.startsWith(".")) {
    const base = path.resolve(
      path.dirname(fileURLToPath(context.parentURL)),
      rewritten
    );
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }
  return next(specifier, context);
}
