/**
 * Metadata for national deal category routes: `/sale`, `/rent`, `/short-term-rent` (+ optional type).
 * Editorial `investment/*` is unrelated — those are different App Router paths.
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchCatalogSeoPageRoot, resolveCatalogSeoPage } from "@/lib/sanity/client";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled, indexingDisabledRobots } from "@/lib/seo/envSeo";
import { stripBrandSuffix } from "@/lib/seo/brandTitle";
import {
  listingUrlHasQueryParams,
  shouldNoindexNonGeoDealTypeCombo,
} from "@/lib/seo/catalogListingMetadata";
import { canonicalNonGeoDealListingPath } from "@/lib/routes/listingRouteResolver";
import { isPublicDealQuery } from "@/lib/catalog/publicDealTypes";
import { listingOpenGraph, listingTitleField } from "@/lib/seo/listingTitle";

type DealQuery = "sale" | "rent" | "short-term";

export async function generateNonGeoDealRouteMetadata(input: {
  locale: string;
  filters: string[];
  search: Record<string, string | string[] | undefined>;
  dealQuery: DealQuery;
  /** Human fragment for default title when CMS title missing, e.g. "sale", "rent", "short-term". */
  titleFragment: string;
}): Promise<Metadata> {
  const { locale, filters, search, dealQuery, titleFragment } = input;
  const t = await getTranslations("Listing.properties");
  const rawSeo = await fetchCatalogSeoPageRoot();
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const typeSeg = filters[0] ? decodeURIComponent(filters[0]).trim() : "";
  // stripBrandSuffix: CMS titles often bake in "| Domlivo"; the root template
  // appends the brand once.
  const title = stripBrandSuffix(
    catalogSeo?.metaTitle ||
      `${t("title")} — ${titleFragment}${typeSeg ? ` — ${typeSeg}` : ""}`
  );
  const description = catalogSeo?.metaDescription || t("description");
  if (!isIndexingEnabled()) {
    return {
      title: listingTitleField(title),
      description,
      openGraph: listingOpenGraph(title, description),
      robots: indexingDisabledRobots,
    };
  }

  const purePath = canonicalNonGeoDealListingPath(locale, dealQuery, typeSeg || undefined).split("?")[0];
  const base = getSiteBaseUrl();
  const pathAfterLocale = purePath.replace(new RegExp(`^/${locale}`), "") || "/";
  const href = buildHreflangAlternates(pathAfterLocale);

  const hasQuery = listingUrlHasQueryParams(search);
  const seoNo = catalogSeo?.noIndex ?? false;
  // Rentals hidden from the public UI: direct URLs stay reachable but noindexed.
  const hiddenDeal = !isPublicDealQuery(dealQuery);
  let thinType = false;
  if (typeSeg && !hasQuery && !seoNo && !hiddenDeal) {
    thinType = await shouldNoindexNonGeoDealTypeCombo(dealQuery, typeSeg);
  }

  const robots =
    hasQuery || seoNo || thinType || hiddenDeal
      ? { index: false as const, follow: true as const }
      : undefined;

  return {
    title: listingTitleField(title),
    description,
    openGraph: listingOpenGraph(title, description),
    alternates: {
      canonical: `${base}${purePath}`,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}
