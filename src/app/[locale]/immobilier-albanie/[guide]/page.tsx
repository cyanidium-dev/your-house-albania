import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FrenchGuideView } from "@/components/frenchPilot/FrenchPilotViews";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { loadFrenchPilot } from "@/lib/frenchPilot/load";
import {
  FRENCH_GUIDE_PATHS,
  FRENCH_HUB_PATH,
  FRENCH_PILOT_CITY,
  FRENCH_PILOT_LOCALE,
  type FrenchGuideKey,
} from "@/lib/frenchPilot/config";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { formatMoney } from "@/lib/currency/format";

type Props = { params: Promise<{ locale: string; guide: string }> };

/**
 * The French pilot's two guides, `/fr/immobilier-albanie/{guide}`: buying
 * from France and seaside prices. French only, like the hub.
 */
export const revalidate = 86400;
export const dynamicParams = false;

function guideKey(segment: string): FrenchGuideKey | null {
  const entry = Object.entries(FRENCH_GUIDE_PATHS).find(([, path]) => path === segment);
  return entry ? (entry[0] as FrenchGuideKey) : null;
}

export function generateStaticParams() {
  return Object.values(FRENCH_GUIDE_PATHS).map((guide) => ({ locale: FRENCH_PILOT_LOCALE, guide }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, guide } = await params;
  const key = guideKey(guide);
  if (locale !== FRENCH_PILOT_LOCALE || !key) return {};
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "FrenchPilot" }), loadFrenchPilot()]);
  const durres = data.snapshot?.cities.find((c) => c.slug === FRENCH_PILOT_CITY);
  const description =
    key === "buying"
      ? t("buying.metaDescription")
      : durres?.median
        ? t("seaside.metaDescription", { durresMedian: `${formatMoney(durres.median, "EUR", locale)}/m²` })
        : t("seaside.metaDescriptionShort");
  const hero = data.listings[0];
  return buildSimplePageMetadata({
    locale,
    title: t(`${key}.metaTitle`),
    description,
    pathAfterLocale: `${FRENCH_HUB_PATH}/${FRENCH_GUIDE_PATHS[key]}`,
    locales: [FRENCH_PILOT_LOCALE],
    photo: hero?.mainImageUrl ? { url: hero.mainImageUrl } : undefined,
    robots: { index: true, follow: true },
  });
}

export default async function FrenchGuidePage({ params }: Props) {
  const { locale, guide } = await params;
  const key = guideKey(guide);
  if (locale !== FRENCH_PILOT_LOCALE || !key) notFound();
  setRequestLocale(locale);
  const data = await loadFrenchPilot();
  return (
    <>
      <FrenchGuideView locale={locale} data={data} guide={key} />
      <ListingContactBar locale={locale} />
    </>
  );
}
