import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { PropertiesDealParam } from "@/lib/catalog/propertiesDealFromLanding";
import { fetchDealTypeLanding, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { isPublicDealQuery } from "@/lib/catalog/publicDealTypes";

export async function buildDealTypeLandingMetadata(
  deal: PropertiesDealParam,
  locale: string,
  options?: { investmentPath?: boolean },
): Promise<Metadata> {
  // Landings for deal types hidden from the public UI (PUBLIC_DEAL_TYPES) stay
  // reachable via direct URLs but must not be indexed — same policy as the
  // /rent and /short-term-rent listing routes.
  const hiddenDealRobots: Metadata["robots"] | undefined = isPublicDealQuery(deal)
    ? undefined
    : { index: false, follow: true };

  const [landing, siteSettings] = await Promise.all([
    fetchDealTypeLanding(deal),
    fetchSiteSettings(),
  ]);
  const t = await getTranslations("Listing.properties");
  if (!landing) {
    return {
      title: t("title"),
      description: t("description"),
      ...(hiddenDealRobots ? { robots: hiddenDealRobots } : {}),
    };
  }
  const landingSeo = (landing as { seo?: unknown }).seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  const pathnameForAlternates =
    deal === "sale"
      ? options?.investmentPath ? "investment/sale" : "sale"
      : deal === "rent"
        ? options?.investmentPath ? "investment/rent" : "rent"
        : deal === "short-term"
          ? options?.investmentPath ? "investment/short-term-rent" : "short-term-rent"
          : undefined;
  const meta = buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale, {
    ...(pathnameForAlternates ? { pathnameForAlternates } : {}),
    contentUpdatedAt: (landing as { contentUpdatedAt?: string }).contentUpdatedAt,
  });
  return hiddenDealRobots ? { ...meta, robots: hiddenDealRobots } : meta;
}
