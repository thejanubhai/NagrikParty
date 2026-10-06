/**
 * Central error reporting helper.
 *
 * Astro's Sentry SDK automatically captures *unhandled* SSR/client errors.
 * This helper exists for the other case: errors we catch and handle
 * gracefully (fallbacks, retries, "ignore and continue" paths), those would
 * otherwise silently disappear into console.error and never reach Sentry.
 *
 * Safe to call from server routes, React islands, and plain modules:
 * it loads the Sentry SDK lazily and never throws.
 */

type SentryLike = {
  captureException: (error: unknown, hint?: { extra?: Record<string, unknown> }) => void;
};

let sentryPromise: Promise<SentryLike | null> | null = null;

/**
 * Load the right Sentry build for the current runtime.
 * - Browser  → @sentry/astro (browser SDK, initialized by sentry.client.config.js)
 * - Worker   → @sentry/cloudflare (Node SDK must never be bundled into the
 *              Cloudflare Worker: it pulls Node builtins and crashes prerender)
 *
 * `import.meta.env.SSR` is a compile-time constant, so each bundle only keeps
 * its own branch.
 */
function loadSentry(): Promise<SentryLike | null> {
  if (!sentryPromise) {
    sentryPromise = (import.meta.env.SSR
      ? import("@sentry/cloudflare")
      : import("@sentry/astro")
    )
      .then((mod) => mod as unknown as SentryLike)
      .catch(() => null);
  }
  return sentryPromise;
}

/**
 * Report a handled error to Sentry without disrupting app flow.
 * @param error  The thrown value (Error, string, or unknown)
 * @param context Free-form tags/extra data to help debugging
 */
export async function captureError(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const normalized =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error));

  if (context && Object.keys(context).length > 0) {
    // Preserve the extra context on the captured event
    normalized.message = normalized.message;
  }

  const sentry = await loadSentry();
  if (!sentry) return;

  try {
    sentry.captureException(normalized, { extra: context });
  } catch {
    // Never let monitoring break the app
  }
}

/** Report a handled error and keep the console trail for local debugging. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[nagrik-error]", error, context ?? {});
  void captureError(error, context);
}
