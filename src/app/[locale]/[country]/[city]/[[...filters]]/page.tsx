import type { Metadata } from "next";
import {
  GeoListingPage,
  geoListingMetadata,
  type GeoListingRouteParams,
} from "@/components/catalog/geoListing/GeoListingRoute";

/**
 * The listing route for URLs without a query string — the ones that rank.
 *
 * It takes no `searchParams`. Awaiting that prop opts a route into per-request
 * rendering, and this one did, so until 2026-09-20 every city, district and
 * facet page answered `Cache-Control: private, no-store` with
 * `x-vercel-cache: MISS` on every hit. A URL that carries a query (`?page=2`,
 * filters, sort) never reaches this file: the middleware rewrites it to
 * `[locale]/listing-query/…`, which renders the same tree with the query
 * (`src/lib/routes/listingQueryRewrite.ts`).
 *
 * ISR needs both exports. `generateStaticParams` is empty on purpose — nothing
 * is prerendered at build, which the Hobby plan could not afford — but without
 * it Next treats a dynamic-segment route as fully dynamic and ignores
 * `revalidate`. The hour is a backstop; the Sanity webhook purges by tag.
 * Do not lower it: a 60 s window exhausted the ISR write quota on 2026-09-19.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<GeoListingRouteParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return geoListingMetadata({ params: await params, search: {} });
}

export default async function CatalogGeoListingPage({ params }: Props) {
  return <GeoListingPage params={await params} search={{}} />;
}
