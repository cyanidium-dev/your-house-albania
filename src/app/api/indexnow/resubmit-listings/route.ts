import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { fetchSitemapPropertyEntries } from "@/lib/sanity/client";
import { submitUrlsToIndexNow, type IndexNowResult } from "@/lib/seo/indexNow";
import { planPropertySitemapUrls } from "@/lib/seo/propertySitemap";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** IndexNow takes 10,000 URLs per request. */
const BATCH = 10_000;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("secret") === secret;
}

/**
 * Announces every listing URL of `sitemap-properties.xml` to IndexNow (Bing,
 * Yandex and the engines behind them; Google does not take part). On publish
 * the Sanity webhook submits the changed listing by itself; this is for the
 * day a whole set of pages becomes indexable at once — the locale experiment
 * closing on 2026-10-19 reopened ~1,080 URLs — and it is run by hand:
 *
 *   GET /api/indexnow/resubmit-listings?secret=<CRON_SECRET>
 *
 * Not a cron: IndexNow is for changed URLs, and a weekly repeat of 5,000
 * unchanged ones is noise the engines are asked not to send.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return new Response("Unauthorized", { status: 401 });

  const base = getSiteBaseUrl().replace(/\/$/, "");
  const rows = await fetchSitemapPropertyEntries();
  const { urls } = planPropertySitemapUrls({ base, locales: routing.locales, rows, imagesPerUrl: 0 });
  const locs = urls.map((u) => u.loc);

  const results: IndexNowResult[] = [];
  for (let i = 0; i < locs.length; i += BATCH) {
    results.push(await submitUrlsToIndexNow(locs.slice(i, i + BATCH)));
  }
  const submitted = results.reduce((n, r) => n + (r.submitted ? r.count : 0), 0);

  return Response.json(
    { ok: true, listings: rows.length, urls: locs.length, submitted, results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
