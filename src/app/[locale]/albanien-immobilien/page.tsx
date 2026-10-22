import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GermanHubView } from "@/components/germanHub/GermanHubView";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { loadGermanHub } from "@/lib/germanHub/load";
import { GERMAN_HUB_LOCALE, GERMAN_HUB_PATH } from "@/lib/germanHub/config";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { formatMoney } from "@/lib/currency/format";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/de/albanien-immobilien`: the German market hub (SEO hypothesis 3,
 * 2026-10-19). German only: every other locale is a 404, and the metadata
 * declares `de` as the only alternate. See `lib/germanHub/config.ts`.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return [{ locale: GERMAN_HUB_LOCALE }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== GERMAN_HUB_LOCALE) return {};
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "GermanHub" }), loadGermanHub()]);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const figures = data.leadCities
    .map((c) => `${resolveLocalizedString(c.title as never, locale) || c.slug} ${money(c.medianPerSqm!)}`)
    .join(", ");
  const hero = data.seaListings[0];
  return buildSimplePageMetadata({
    locale,
    title: t("metaTitle"),
    description:
      figures && data.seaListings.length > 0
        ? t("metaDescription", { figures, sea: data.seaListings.length })
        : t("metaDescriptionShort"),
    pathAfterLocale: GERMAN_HUB_PATH,
    locales: [GERMAN_HUB_LOCALE],
    photo: hero?.mainImageUrl ? { url: hero.mainImageUrl } : undefined,
    robots: { index: true, follow: true },
  });
}

export default async function GermanHubPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== GERMAN_HUB_LOCALE) notFound();
  setRequestLocale(locale);
  const data = await loadGermanHub();
  return (
    <>
      <GermanHubView locale={locale} data={data} />
      <ListingContactBar locale={locale} />
    </>
  );
}
