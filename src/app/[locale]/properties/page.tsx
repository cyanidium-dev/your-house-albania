import HeroSub from "@/components/shared/HeroSub";
import PropertiesListing from "@/components/Properties/PropertyList";
import React from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Property List | Domlivo",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

