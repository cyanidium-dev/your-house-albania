import { PRICE_INDEX_LICENSE_URL, PRICE_INDEX_REVALIDATE_SECONDS } from "@/lib/priceIndex/publish";

/**
 * Headers of every `/data/prices/` file: an hour of caching (the figures are
 * recomputed hourly), the licence as a `Link` header, and CORS open, since the
 * point of an open dataset is that a notebook or a newsroom tool can fetch it.
 */
export function priceIndexFileHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Cache-Control": `public, max-age=${PRICE_INDEX_REVALIDATE_SECONDS}, s-maxage=${PRICE_INDEX_REVALIDATE_SECONDS}`,
    Link: `<${PRICE_INDEX_LICENSE_URL}>; rel="license"`,
    "Access-Control-Allow-Origin": "*",
  };
}
