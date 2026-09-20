import type { Metadata } from "next";
import { NonGeoDealListingPage } from "@/components/catalog/NonGeoDealListingPage";
import { generateNonGeoDealRouteMetadata } from "@/lib/seo/nonGeoDealRouteMetadata";

/**
 * The national sale hub, `/{locale}/sale` and `/{locale}/sale/{type}`, for URLs
 * without a query string — the ones that rank.
 *
 * It takes no `searchParams`. Awaiting that prop opts a route into per-request
 * rendering, and until 2026-09-20 this one did: `/en/sale` answered
 * `Cache-Control: private, no-store` with `x-vercel-cache: MISS` on every hit.
 * A URL that carries a query (`?page=2`, filters, sort) never reaches this
 * file: the middleware rewrites it to `[locale]/listing-query/sale/…`, which
 * renders the same tree with the query (`src/lib/routes/listingQueryRewrite.ts`).
 *
 * ISR needs both exports, as on the geo listing route: an empty
 * `generateStaticParams` (nothing prerendered at build) and `revalidate`. The
 * hour is a backstop; the Sanity webhook purges by tag. Do not lower it: a 60 s
 * window exhausted the ISR write quota on 2026-09-19.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; filters?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, filters = [] } = await params;
  return generateNonGeoDealRouteMetadata({ locale, filters, search: {}, dealQuery: "sale", titleFragment: "sale" });
}

export default async function SaleDealListingPage({ params }: Props) {
  const { locale, filters = [] } = await params;
  return (
    <NonGeoDealListingPage locale={locale} dealRouteSegment="sale" dealQuery="sale" filters={filters} searchParams={{}} />
  );
}
