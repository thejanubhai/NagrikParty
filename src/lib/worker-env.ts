// Worker runtime env resolution for Astro v6 on Cloudflare.
// Astro v6 removed `Astro.locals.runtime.env`. The supported path is the
// `cloudflare:workers` module (dynamic import so local node dev doesn't break).
let cachedEnv: Record<string, string | undefined> | null = null;

export async function resolveRuntimeEnv(): Promise<Record<string, string | undefined>> {
  if (cachedEnv) return cachedEnv;
  try {
    const mod = (await import(/* @vite-ignore */ "cloudflare:workers")) as {
      env?: Record<string, string | undefined>;
    };
    cachedEnv = mod.env || {};
  } catch {
    cachedEnv = {};
  }
  return cachedEnv;
}

export function envOf(
  runtimeEnv: Record<string, string | undefined>,
  key: string
): string | undefined {
  const importEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  return runtimeEnv[key] ?? importEnv[key];
}
