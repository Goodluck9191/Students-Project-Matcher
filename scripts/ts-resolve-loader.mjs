/**
 * Test-only ESM loader: resolves extensionless relative imports and the
 * `@/` path alias to their `.ts` sources so `npm run test:matching` can
 * execute the pure matching engine with plain Node (no test framework).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export async function resolve(specifier, context, next) {
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
