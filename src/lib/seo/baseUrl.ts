import { headers } from "next/headers";

/**
 * Resolves the site base URL for absolute URLs in structured data.
 * Uses request headers when available, falls back to env or empty.
 */
export async function getBaseUrl(): Promise<string> {
  if (typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // headers() can throw in edge/static contexts
  }
  return "";
}
