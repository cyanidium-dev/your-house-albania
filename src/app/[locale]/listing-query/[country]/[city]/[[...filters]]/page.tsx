import type { Metadata } from "next";
import {
  GeoListingPage,
  geoListingMetadata,
  type GeoListingRouteParams,
} from "@/components/catalog/geoListing/GeoListingRoute";

/**
 * The listing route for URLs WITH a query string (`?page=2`, filters, sort).
 *
 * Never linked and never visible: the middleware rewrites
 * `/{locale}/{country}/{city}/…?query` here and redirects anyone who types this
 * path back to the public one (`src/lib/routes/listingQueryRewrite.ts`). It
 * exists so that reading `searchParams` — which forces per-request rendering —
 * happens in a route of its own and the path-only listing pages stay cached.
 * Everything rendered, and the `noindex, follow` + canonical a query URL gets,
 * comes from the same module the cached route uses.
 */
type Props = {
  params: Promise<GeoListingRouteParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [p, search] = await Promise.all([params, searchParams]);
  return geoListingMetadata({ params: p, search });
}

export default async function CatalogGeoListingQueryPage({ params, searchParams }: Props) {
  const [p, search] = await Promise.all([params, searchParams]);
  return <GeoListingPage params={p} search={search} />;
}
