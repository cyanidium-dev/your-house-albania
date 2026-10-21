import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FrenchHubView, frenchLeadFigures } from "@/components/frenchPilot/FrenchPilotViews";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { loadFrenchPilot } from "@/lib/frenchPilot/load";
import { FRENCH_HUB_PATH, FRENCH_PILOT_LOCALE } from "@/lib/frenchPilot/config";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/fr/immobilier-albanie`: the French market hub (French pilot,
 * 2026-10-21). French only: every other locale is a 404, and the metadata
 * declares `fr` as the only alternate. See `lib/frenchPilot/config.ts`.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [{ locale: FRENCH_PILOT_LOCALE }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== FRENCH_PILOT_LOCALE) return {};
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "FrenchPilot" }), loadFrenchPilot()]);
  const figures = frenchLeadFigures(t, locale, data);
  const count = Math.min(12, data.listings.length);
  const hero = data.listings[0];
  return buildSimplePageMetadata({
    locale,
    title: t("hub.metaTitle"),
    description: figures && count > 0 ? t("hub.metaDescription", { figures, count }) : t("hub.metaDescriptionShort"),
    pathAfterLocale: FRENCH_HUB_PATH,
    locales: [FRENCH_PILOT_LOCALE],
    photo: hero?.mainImageUrl ? { url: hero.mainImageUrl } : undefined,
    robots: { index: true, follow: true },
  });
}

export default async function FrenchHubPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== FRENCH_PILOT_LOCALE) notFound();
  setRequestLocale(locale);
  const data = await loadFrenchPilot();
  return (
    <>
      <FrenchHubView locale={locale} data={data} />
      <ListingContactBar locale={locale} />
    </>
  );
}
