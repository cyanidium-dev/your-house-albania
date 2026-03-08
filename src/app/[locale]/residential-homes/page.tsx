import HeroSub from "@/components/shared/HeroSub";
import ResidentialList from "@/components/Properties/Residential";
import React from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Property List | Domlivo",
};

type Props = { params: Promise<{ locale: string }> };

export default async function page({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Listing.residentialHomes");
  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
      />
      <ResidentialList locale={locale} />
    </>
  );
}
