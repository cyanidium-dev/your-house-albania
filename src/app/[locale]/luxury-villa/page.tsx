import HeroSub from "@/components/shared/HeroSub";
import LuxuryVillas from "@/components/Properties/LuxuryVilla";
import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildStaticListingMetadata } from "@/lib/seo/staticListingMetadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildStaticListingMetadata({
    locale,
    pathnameAfterLocale: "/luxury-villa",
    i18nNamespace: "Listing.luxuryVilla",
  });
}

export default async function page({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Listing.luxuryVilla");
  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
      />
      <LuxuryVillas locale={locale} />
    </>
  );
}
