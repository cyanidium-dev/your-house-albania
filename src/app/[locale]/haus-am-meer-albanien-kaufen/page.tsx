import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SeaHousesView } from "@/components/seaHouses/SeaHousesView";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { loadSeaHouses } from "@/lib/seaHouses/load";
import { SEA_HOUSES_LOCALE, SEA_HOUSES_PATH } from "@/lib/seaHouses/config";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { formatMoney } from "@/lib/currency/format";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/de/haus-am-meer-albanien-kaufen`: houses and villas by the sea for German
 * buyers (2026-10-24). German only: every other locale is a 404, and the
 * metadata declares `de` as the only alternate. See `lib/seaHouses/config.ts`.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return [{ locale: SEA_HOUSES_LOCALE }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== SEA_HOUSES_LOCALE) return {};
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "SeaHouses" }), loadSeaHouses()]);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const { figures } = data;
  const hasFigures = figures.count > 0 && figures.from !== null;
  return buildSimplePageMetadata({
    locale,
    title: hasFigures ? t("metaTitle", { count: figures.count, from: money(figures.from!) }) : t("metaTitleShort"),
    description:
      hasFigures && figures.median !== null
        ? t("metaDescription", { count: figures.count, from: money(figures.from!), median: money(figures.median), beachfront: figures.beachfront })
        : t("metaDescriptionShort"),
    pathAfterLocale: SEA_HOUSES_PATH,
    locales: [SEA_HOUSES_LOCALE],
    photo: data.cards[0]?.mainImageUrl ? { url: data.cards[0].mainImageUrl } : undefined,
    robots: { index: true, follow: true },
  });
}

export default async function SeaHousesPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== SEA_HOUSES_LOCALE) notFound();
  setRequestLocale(locale);
  const data = await loadSeaHouses();
  return (
    <>
      <SeaHousesView locale={locale} data={data} />
      <ListingContactBar locale={locale} />
    </>
  );
}
