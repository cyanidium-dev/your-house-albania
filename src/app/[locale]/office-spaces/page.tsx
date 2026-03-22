import HeroSub from "@/components/shared/HeroSub";
import OfficeSpace from "@/components/Properties/OfficeSpaces";
import React from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Property List | Your House Albania",
};

type Props = { params: Promise<{ locale: string }> };

export default async function page({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Listing.officeSpaces");
  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
      />
      <OfficeSpace locale={locale} />
    </>
  );
}
