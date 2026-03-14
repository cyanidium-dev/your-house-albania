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
import { fetchSiteSettings, fetchCatalogSeoPageRoot, resolveCatalogSeoPage } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [siteSettings, rawSeo] = await Promise.all([
    fetchSiteSettings(),
    fetchCatalogSeoPageRoot(),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const defaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo as
    | {
        metaTitle?: Record<string, string>;
        metaDescription?: Record<string, string>;
      }
    | undefined;

  const t = await getTranslations("Listing.properties");

  const localizedTitleFromSeo =
    defaultSeo?.metaTitle &&
    resolveLocalizedString(defaultSeo.metaTitle as never, locale);
  const localizedDescriptionFromSeo =
    defaultSeo?.metaDescription &&
    resolveLocalizedString(defaultSeo.metaDescription as never, locale);

  const listTitle = t("title");
  const listDescription = t("description");

  const title = catalogSeo?.metaTitle
    ? catalogSeo.metaTitle
    : localizedTitleFromSeo
      ? `${listTitle} | ${localizedTitleFromSeo}`
      : listTitle;

  const description =
    catalogSeo?.metaDescription ||
    localizedDescriptionFromSeo ||
    listDescription;

  return {
    title,
    description,
  };
}

export default async function page({ params, searchParams }: Props) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);

  const cityQ = typeof search.city === "string" ? search.city.trim().toLowerCase() : "";
  const districtQ = typeof search.district === "string" ? search.district.trim() : "";
  if (cityQ && districtQ) {
    redirect(`/${locale}/properties/${encodeURIComponent(cityQ)}/${encodeURIComponent(districtQ)}${buildQueryString(search, ["city", "district"])}`);
  }
  if (cityQ) {
    redirect(`/${locale}/properties/${encodeURIComponent(cityQ)}${buildQueryString(search, ["city", "district"])}`);
  }

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageRoot();
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        breadcrumb={<CatalogBreadcrumb locale={locale} />}
      />
      <PropertiesListing
        locale={locale}
        searchParams={search}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}

