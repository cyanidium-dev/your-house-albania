import type { Metadata } from "next";
import HeroSub from "@/components/shared/HeroSub";
import PropertiesListing from "@/components/Properties/PropertyList";
import React from "react";
import { getTranslations } from "next-intl/server";
import { fetchSiteSettings } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const siteSettings = await fetchSiteSettings();
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

  const title = localizedTitleFromSeo
    ? `${listTitle} | ${localizedTitleFromSeo}`
    : listTitle;

  const description = localizedDescriptionFromSeo || listDescription;

  return {
    title,
    description,
  };
}

export default async function page({ params, searchParams }: Props) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  const t = await getTranslations("Listing.properties");
  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
      />
      <PropertiesListing locale={locale} searchParams={search} />
    </>
  );
}

