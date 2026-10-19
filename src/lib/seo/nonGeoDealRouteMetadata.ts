/**
 * Metadata for national deal category routes: `/sale`, `/rent`, `/short-term-rent` (+ optional type).
 * Editorial `investment/*` is unrelated — those are different App Router paths.
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchCatalogSeoPageRoot, resolveCatalogSeoPage } from "@/lib/sanity/client";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled, indexingDisabledRobots, indexableRobots } from "@/lib/seo/envSeo";
import { stripBrandSuffix } from "@/lib/seo/brandTitle";
import {
  listingPageQuery,
  listingPaginationPage,
  listingUrlHasQueryParams,
  shouldNoindexNonGeoDealTypeCombo,
} from "@/lib/seo/catalogListingMetadata";
import { canonicalNonGeoDealListingPath } from "@/lib/routes/listingRouteResolver";
import { isPublicDealQuery } from "@/lib/catalog/publicDealTypes";
import { listingOpenGraph, listingPageTitle, listingTitleField } from "@/lib/seo/listingTitle";
import { landingOgImageUrl } from "@/lib/seo/ogImageUrl";
import { heroPhotoFor } from "@/lib/media/albaniaPhotos";
import { buildTypeListingSeo } from "@/lib/seo/listingSeoCopy";

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
  const t = await getTranslations({ locale, namespace: "Listing.properties" });
  const rawSeo = await fetchCatalogSeoPageRoot();
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const typeSeg = filters[0] ? decodeURIComponent(filters[0]).trim() : "";
  // The CMS `catalogSeoPage` fetched here is root-scoped — one document for the
  // whole national catalogue, with no type dimension. Taken as-is it gave
  // `/sale` and `/sale/apartment` byte-identical titles and descriptions in
  // every locale, so the type page could never target its own keyword
  // ("mieszkania w albanii", "albania apartments for sale"). On a type page the
  // generated type copy therefore wins over the CMS value; untyped pages are
  // unchanged.
  const typedSeo = typeSeg ? await buildTypeListingSeo(typeSeg, locale) : null;
  // stripBrandSuffix: CMS titles often bake in "| Domlivo"; the root template
  // appends the brand once.
  const title = stripBrandSuffix(
    typedSeo?.title ||
      catalogSeo?.metaTitle ||
      `${t("title")} — ${titleFragment}${typeSeg ? ` — ${typeSeg}` : ""}`
  );
  const description = typedSeo?.description || catalogSeo?.metaDescription || t("description");
  // `?page=N` alone is a page of its own (catalogListingMetadata): own title,
  // self-canonical, indexed exactly when page one is.
  const listingPage = listingPaginationPage(search);
  const titlePage = { page: listingPage, locale };
  // The social card: title and description over a photograph that fits the deal or type.
  const ogImage = landingOgImageUrl({
    locale,
    title,
    subtitle: description,
    photo: { key: heroPhotoFor({ propertyType: typeSeg || null, deal: dealQuery }).key },
  });
  if (!isIndexingEnabled()) {
    return {
      title: listingTitleField(title, titlePage),
      description,
      openGraph: listingOpenGraph(listingPageTitle(title, titlePage), description, ogImage, undefined, locale),
      robots: indexingDisabledRobots,
    };
  }

  const purePath = canonicalNonGeoDealListingPath(locale, dealQuery, typeSeg || undefined).split("?")[0];
  const base = getSiteBaseUrl();
  const pathAfterLocale = purePath.replace(new RegExp(`^/${locale}`), "") || "/";
  const canonical = `${base}${purePath}${listingPageQuery(listingPage)}`;

  const hasQuery = listingPage ? false : listingUrlHasQueryParams(search);
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
      : indexableRobots;
  // Page N declares alternates only while it is indexed: each locale's page N
  // lists the same cards in the same order (inventory and sort are not
  // per-locale), so the set is reciprocal; a noindexed page N declares none.
  // Page one and filtered copies keep pointing at the bare paths as before.
  const href = listingPage
    ? robots.index
      ? buildHreflangAlternates(`${pathAfterLocale}${listingPageQuery(listingPage)}`)
      : undefined
    : buildHreflangAlternates(pathAfterLocale);

  return {
    title: listingTitleField(title, titlePage),
    description,
    openGraph: listingOpenGraph(listingPageTitle(title, titlePage), description, ogImage, canonical, locale),
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}
