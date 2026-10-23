import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SeaFlatsView } from "@/components/seaFlats/SeaFlatsView";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { loadSeaFlats } from "@/lib/seaFlats/load";
import { SEA_FLATS_PATHS } from "@/lib/seaFlats/config";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { formatMoney } from "@/lib/currency/format";

/**
 * The page behind each seaside flats route (`lib/seaFlats/config.ts`): one
 * locale per path, every other locale a 404, the metadata declaring that
 * locale as the only alternate. The route files are one line each.
 */
export function seaFlatsStaticParams(locale: string) {
  return [{ locale }];
}

export async function seaFlatsMetadata(locale: string, requested: string): Promise<Metadata> {
  if (requested !== locale) return {};
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "SeaFlats" }), loadSeaFlats()]);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const { figures } = data;
  const hasFigures = figures.count > 0 && figures.from !== null;
  return buildSimplePageMetadata({
    locale,
    title: hasFigures ? t("metaTitle", { count: figures.count, from: money(figures.from!) }) : t("metaTitleShort"),
    description:
      hasFigures && figures.medianPerSqm !== null
        ? t("metaDescription", { count: figures.count, from: money(figures.from!), median: money(figures.medianPerSqm), beachfront: figures.beachfront, cities: data.cities.length })
        : t("metaDescriptionShort"),
    pathAfterLocale: SEA_FLATS_PATHS[locale],
    locales: [locale],
    photo: data.cards[0]?.mainImageUrl ? { url: data.cards[0].mainImageUrl } : undefined,
    robots: { index: true, follow: true },
  });
}

export async function SeaFlatsPage({ locale, requested }: { locale: string; requested: string }) {
  if (requested !== locale) notFound();
  setRequestLocale(locale);
  const data = await loadSeaFlats();
  return (
    <>
      <SeaFlatsView locale={locale} data={data} />
      <ListingContactBar locale={locale} />
    </>
  );
}
