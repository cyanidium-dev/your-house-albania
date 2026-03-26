import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { PropertiesDealParam } from "@/lib/catalog/propertiesDealFromLanding";
import { fetchDealTypeLanding, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";

export async function buildDealTypeLandingMetadata(
  deal: PropertiesDealParam,
  locale: string,
): Promise<Metadata> {
  const [landing, siteSettings] = await Promise.all([
    fetchDealTypeLanding(deal),
    fetchSiteSettings(),
  ]);
  const t = await getTranslations("Listing.properties");
  if (!landing) {
    return {
      title: t("title"),
      description: t("description"),
    };
  }
  const landingSeo = (landing as { seo?: unknown }).seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale);
}
