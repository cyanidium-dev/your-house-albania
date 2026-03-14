import type { Metadata } from "next";
import HeroSub from "@/components/shared/HeroSub";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import React from "react";
import { getTranslations } from "next-intl/server";
import { fetchSiteSettings } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  params: Promise<{ locale: string; city: string; district: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city, district } = await params;
  const siteSettings = await fetchSiteSettings();
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
  const title = locationLabel
    ? `${listTitle} — ${locationLabel}`
    : localizedTitleFromSeo
      ? `${listTitle} | ${localizedTitleFromSeo}`
      : listTitle;

  const description = defaultSeo?.metaDescription
    ? resolveLocalizedString(defaultSeo.metaDescription as never, locale) || listDescription
    : listDescription;

  return { title, description };
}

export default async function CatalogCityDistrictPage({
  params,
  searchParams,
}: Props) {
  const [{ locale, city, district }, search] = await Promise.all([
    params,
    searchParams,
  ]);
  const citySlug = decodeURIComponent(city).toLowerCase();
  const districtSlug = decodeURIComponent(district).toLowerCase();

  const t = await getTranslations("Listing.properties");
  return (
    <>
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-8 pb-2">
        <CatalogBreadcrumb locale={locale} city={citySlug} district={districtSlug} />
      </div>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
      />
      <PropertiesListing
        locale={locale}
        pathCity={citySlug}
        pathDistrict={districtSlug}
        searchParams={search}
      />
    </>
  );
}
