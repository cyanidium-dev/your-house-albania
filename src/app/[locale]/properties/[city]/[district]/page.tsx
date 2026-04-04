import type { Metadata } from "next";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import React from "react";
import { getTranslations } from "next-intl/server";
import { fetchSiteSettings, fetchCatalogSeoPageByDistrict, resolveCatalogSeoPage } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { parseCatalogFilters } from "@/lib/catalog/parseCatalogFilters";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { shouldCatalogListingNoindex } from "@/lib/seo/catalogListingMetadata";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";

type Props = {
  params: Promise<{ locale: string; city: string; district: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, city, district } = await params;
  const search = await searchParams;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const districtSlug = decodeURIComponent(district).toLowerCase();
  const [siteSettings, rawSeo] = await Promise.all([
    fetchSiteSettings(),
    fetchCatalogSeoPageByDistrict(citySlug, districtSlug),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const defaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo as
    | {
        metaTitle?: Record<string, string>;
        metaDescription?: Record<string, string>;
      }
    | undefined;

  const t = await getTranslations("Listing.properties");
  const listTitle = t("title");
  const listDescription = t("description");
  const cityTitle = city ? decodeURIComponent(city).replace(/-/g, " ") : "";
  const districtTitle = district ? decodeURIComponent(district).replace(/-/g, " ") : "";
  const localizedTitleFromSeo =
    defaultSeo?.metaTitle &&
    resolveLocalizedString(defaultSeo.metaTitle as never, locale);

  const locationLabel = [districtTitle, cityTitle].filter(Boolean).join(" · ") || cityTitle;
  const title = catalogSeo?.metaTitle
    ? catalogSeo.metaTitle
    : locationLabel
      ? `${listTitle} — ${locationLabel}`
      : localizedTitleFromSeo
        ? `${listTitle} | ${localizedTitleFromSeo}`
        : listTitle;

  const description =
    catalogSeo?.metaDescription ||
    (defaultSeo?.metaDescription
      ? resolveLocalizedString(defaultSeo.metaDescription as never, locale) || listDescription
      : listDescription);

  if (!isIndexingEnabled()) {
    return {
      title,
      description,
      robots: indexingDisabledRobots,
    };
  }

  const baseUrl = getSiteBaseUrl();
  const path = `/properties/${encodeURIComponent(citySlug)}/${encodeURIComponent(districtSlug)}`;
  const canonical = `${baseUrl}/${locale}${path}`;
  const href = buildHreflangAlternates(path);
  const noindexQuery = shouldCatalogListingNoindex(search);
  const seoNoIndex = catalogSeo?.noIndex ?? false;
  const robots =
    noindexQuery || seoNoIndex ? { index: false as const, follow: true as const } : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function CatalogCityDistrictPage({
  params,
  searchParams,
}: Props) {
  const [{ locale, city, district }, search] = await Promise.all([
    params,
    searchParams,
  ]);
  const parsed = parseCatalogFilters({ city, district }, search);
  const citySlug = parsed.city;
  const districtSlug = parsed.district;

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageByDistrict(citySlug, districtSlug);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        breadcrumb={<CatalogBreadcrumb locale={locale} city={citySlug} district={districtSlug} />}
      />
      <PropertiesListing
        locale={locale}
        pathCity={citySlug}
        pathDistrict={districtSlug}
        searchParams={search}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
