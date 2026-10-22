import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ShengjinHubView } from "@/components/shengjinHub/ShengjinHubView";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { loadShengjinHub } from "@/lib/shengjinHub/load";
import { SHENGJIN_HUB_PATH } from "@/lib/shengjinHub/config";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { isLocalePathIndexable } from "@/lib/seo/localeIndexing";
import { formatMoney } from "@/lib/currency/format";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/{locale}/shengjin`: the Shëngjin hub (2026-10-22), every locale. See
 * `lib/shengjinHub/config.ts`. The title and description carry the live
 * figures: the lowest flat price, the median €/m² and the listing count.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "ShengjinHub" }), loadShengjinHub()]);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const shengjin = data.compare.find((c) => c.slug === "shengjin");
  const durres = data.compare.find((c) => c.slug === "durres");
  const listings = data.city?.listings ?? data.flats.length;
  const hero = data.seaListings[0];
  const hasFigures = !!shengjin && shengjin.flatPriceFrom !== null && shengjin.medianPerSqm !== null && listings > 0;
  const indexable = isLocalePathIndexable(locale, `/${SHENGJIN_HUB_PATH}`);
  return buildSimplePageMetadata({
    locale,
    title: hasFigures ? t("metaTitle", { from: money(shengjin.flatPriceFrom!), listings }) : t("metaTitleShort"),
    description:
      hasFigures && durres?.medianPerSqm
        ? t("metaDescription", {
            median: money(shengjin.medianPerSqm!),
            durresMedian: money(durres.medianPerSqm),
            from: money(shengjin.flatPriceFrom!),
            sea: data.seaCount,
            listings,
          })
        : t("metaDescriptionShort"),
    pathAfterLocale: SHENGJIN_HUB_PATH,
    photo: hero?.mainImageUrl ? { url: hero.mainImageUrl } : undefined,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  });
}

export default async function ShengjinHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await loadShengjinHub();
  return (
    <>
      <ShengjinHubView locale={locale} data={data} />
      <ListingContactBar locale={locale} />
    </>
  );
}
