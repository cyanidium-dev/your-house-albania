import { getSiteBaseUrl } from "@/lib/siteUrl";

/**
 * Resolves the site base URL for absolute URLs in structured data.
 *
 * This used to fall back to `headers()` when `NEXT_PUBLIC_SITE_URL` was unset,
 * reading the request host. That call is what made every page calling it —
 * districts, city info, blog posts, guides, properties — render per request:
 * `headers()` opts a route into dynamic rendering whether or not the branch is
 * ever taken, and a route that renders per request is never cached.
 *
 * Production sets `NEXT_PUBLIC_SITE_URL`, so the header path was already dead
 * there; keeping it only meant local builds disagreed with production about
 * which routes are static, and that the whole site would silently fall back to
 * per-request rendering if the variable were ever removed.
 *
 * Still `async`: 38 call sites await it, and its result is awaited alongside
 * genuinely async work.
 */
export async function getBaseUrl(): Promise<string> {
  return getSiteBaseUrl().replace(/\/$/, "");
}
