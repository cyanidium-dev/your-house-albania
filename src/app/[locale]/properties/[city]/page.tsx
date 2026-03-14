import type { Metadata } from "next";
import { redirect } from "next/navigation";

function buildQueryString(
  search: Record<string, string | string[] | undefined>,
  exclude: string[]
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (exclude.includes(k)) continue;
    if (typeof v === "string") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import React from "react";
import { getTranslations } from "next-intl/server";
import { fetchPropertyBySlug, fetchSiteSettings, fetchCatalogSeoPageByCity, resolveCatalogSeoPage } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  params: Promise<{ locale: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const [siteSettings, rawSeo] = await Promise.all([
    fetchSiteSettings(),
    fetchCatalogSeoPageByCity(citySlug),
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
  const localizedTitleFromSeo =
    defaultSeo?.metaTitle &&
    resolveLocalizedString(defaultSeo.metaTitle as never, locale);

  const title = catalogSeo?.metaTitle
    ? catalogSeo.metaTitle
    : cityTitle
      ? `${listTitle} — ${cityTitle}`
      : localizedTitleFromSeo
        ? `${listTitle} | ${localizedTitleFromSeo}`
        : listTitle;

  const description =
    catalogSeo?.metaDescription ||
    (defaultSeo?.metaDescription
      ? resolveLocalizedString(defaultSeo.metaDescription as never, locale) || listDescription
      : listDescription);

  return { title, description };
}

export default async function CatalogCityPage({ params, searchParams }: Props) {
  const [{ locale, city }, search] = await Promise.all([params, searchParams]);
  const citySlug = decodeURIComponent(city).toLowerCase();
  const districtQ = typeof search.district === "string" ? search.district.trim() : "";
  if (districtQ) {
    redirect(`/${locale}/properties/${encodeURIComponent(citySlug)}/${encodeURIComponent(districtQ)}${buildQueryString(search, ["district"])}`);
  }

  const property = await fetchPropertyBySlug(citySlug);
  if (property != null) {
    redirect(`/${locale}/property/${citySlug}`);
  }

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageByCity(citySlug);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        breadcrumb={<CatalogBreadcrumb locale={locale} city={citySlug} />}
      />
      <PropertiesListing
        locale={locale}
        pathCity={citySlug}
        searchParams={search}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
