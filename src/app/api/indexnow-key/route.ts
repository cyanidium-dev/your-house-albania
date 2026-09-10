import { NextResponse } from "next/server";
import { indexNowKey } from "@/lib/seo/indexNow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The IndexNow key file.
 *
 * The protocol verifies ownership by fetching a plain-text file on the host
 * that contains the key. `next.config.ts` rewrites `/indexnow-{key}.txt` here,
 * so the public URL has the `.txt` shape the spec describes without a
 * catch-all route that could shadow `robots.txt` or the sitemaps.
 *
 * 404 when `INDEXNOW_KEY` is unset — the same switch that keeps
 * `submitUrlsToIndexNow` silent, so the feature is wholly off or wholly on.
 */
export async function GET() {
  const key = indexNowKey();
  if (!key) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
