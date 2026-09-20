import type { Metadata } from "next";
import { NonGeoDealListingPage } from "@/components/catalog/NonGeoDealListingPage";
import { generateNonGeoDealRouteMetadata } from "@/lib/seo/nonGeoDealRouteMetadata";

/**
 * The national sale hub for URLs WITH a query string (`?page=2`, filters, sort).
 *
 * Never linked and never visible: the middleware rewrites `/{locale}/sale…?query`
 * here and redirects anyone who types this path back to the public one
 * (`src/lib/routes/listingQueryRewrite.ts`). Reading `searchParams` forces
 * per-request rendering, so it happens in a route of its own and the path-only
 * hub stays cached. The tree, and the `noindex, follow` + canonical a query URL
 * gets, come from the same two functions the cached route calls.
 */
type Props = {
  params: Promise<{ locale: string; filters?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, filters = [] }, search] = await Promise.all([params, searchParams]);
  return generateNonGeoDealRouteMetadata({ locale, filters, search, dealQuery: "sale", titleFragment: "sale" });
}

export default async function SaleDealListingQueryPage({ params, searchParams }: Props) {
  const [{ locale, filters = [] }, search] = await Promise.all([params, searchParams]);
  return (
    <NonGeoDealListingPage locale={locale} dealRouteSegment="sale" dealQuery="sale" filters={filters} searchParams={search} />
  );
}
