import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled } from "@/lib/seo/envSeo";

/**
 * IndexNow — push changed URLs to Bing, Yandex and the other participating
 * engines instead of waiting to be crawled. Google does not participate; this
 * is what feeds Bing's index, and through it Microsoft Copilot.
 *
 * The Ahrefs crawl of 2026-09-10 reported 1,911 changed pages never submitted.
 *
 * Disabled until `INDEXNOW_KEY` is set, so nothing is announced to a third
 * party by merely deploying this. Set the variable, and the key file at
 * {@link indexNowKeyLocation} starts answering with the same value, which is
 * how the API verifies ownership.
 */

/** Batch ceiling from the IndexNow spec. */
const MAX_URLS_PER_REQUEST = 10_000;

const ENDPOINT = "https://api.indexnow.org/indexnow";

/** A key must be 8–128 hexadecimal characters. */
const KEY_PATTERN = /^[a-f0-9]{8,128}$/i;

export function indexNowKey(): string | null {
  const raw = (process.env.INDEXNOW_KEY ?? "").trim();
  return KEY_PATTERN.test(raw) ? raw : null;
}

/**
 * Where the key file lives. A rewrite in `next.config.ts` maps this `.txt` URL
 * onto the route that serves it — the protocol wants a plain-text file, and a
 * scoped rewrite keeps it from shadowing `robots.txt` or the sitemaps.
 */
export function indexNowKeyLocation(key: string): string {
  return `${getSiteBaseUrl().replace(/\/$/, "")}/indexnow-${key}.txt`;
}

export type IndexNowResult =
  | { submitted: false; reason: "no-key" | "indexing-disabled" | "no-urls" }
  | { submitted: true; count: number; status: number }
  | { submitted: false; reason: "error"; error: string };

/**
 * Submit absolute URLs. Never throws and never blocks anything important: a
 * search-engine ping failing is not a reason for a content webhook to fail.
 */
export async function submitUrlsToIndexNow(urls: string[]): Promise<IndexNowResult> {
  // A preview deployment announcing production URLs would be worse than silence.
  if (!isIndexingEnabled()) return { submitted: false, reason: "indexing-disabled" };

  const key = indexNowKey();
  if (!key) return { submitted: false, reason: "no-key" };

  const base = getSiteBaseUrl().replace(/\/$/, "");
  const host = new URL(base).host;
  const unique = Array.from(
    new Set(urls.filter((u) => typeof u === "string" && u.startsWith(base))),
  ).slice(0, MAX_URLS_PER_REQUEST);
  if (unique.length === 0) return { submitted: false, reason: "no-urls" };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: indexNowKeyLocation(key),
        urlList: unique,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return { submitted: true, count: unique.length, status: response.status };
  } catch (err) {
    return { submitted: false, reason: "error", error: String(err).slice(0, 200) };
  }
}

/**
 * One path after the locale → the same page in every locale, absolute.
 *
 * Submitting all six is right: a Sanity document holds every translation, so a
 * change to it changes every localized URL that renders it.
 */
export function localizedUrls(pathAfterLocale: string): string[] {
  const base = getSiteBaseUrl().replace(/\/$/, "");
  const path = pathAfterLocale.replace(/^\/+/, "");
  return routing.locales.map((locale) => `${base}/${locale}${path ? `/${path}` : ""}`);
}
