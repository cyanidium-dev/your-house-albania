import { fetchPriceIndexSnapshot } from "@/lib/sanity/client";
import { buildPriceIndexJson } from "@/lib/priceIndex/publish";
import { priceIndexFileHeaders } from "@/lib/priceIndex/httpHeaders";
import { getSiteBaseUrl } from "@/lib/siteUrl";

/**
 * `/data/prices/index.json`: the Domlivo Price Index for every city and
 * district, CC BY 4.0. Same snapshot as the `/info` pages; regenerated at most
 * hourly. Outside `/api/`, which robots.txt closes to crawlers.
 */
export const revalidate = 86400;

export async function GET() {
  const snapshot = await fetchPriceIndexSnapshot();
  if (!snapshot) {
    return new Response(JSON.stringify({ error: "The price index is unavailable right now." }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8", "Retry-After": "600" },
    });
  }
  const body = buildPriceIndexJson(snapshot, getSiteBaseUrl());
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: priceIndexFileHeaders("application/json; charset=utf-8"),
  });
}
