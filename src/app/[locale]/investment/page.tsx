import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InvestmentHubView } from "@/components/investmentHub/InvestmentHubView";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { loadInvestmentHub } from "@/lib/investmentHub/load";
import { INVESTMENT_HUB_LOCALES, INVESTMENT_HUB_PATH } from "@/lib/investmentHub/config";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { formatMoney } from "@/lib/currency/format";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/{locale}/investment`: the investment hub (2026-10-24) in the locales it
 * is written in; every other locale is a 404 and the metadata lists only the
 * written ones. See `lib/investmentHub/config.ts`.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return INVESTMENT_HUB_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!INVESTMENT_HUB_LOCALES.includes(locale)) return {};
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "InvestmentHub" }), loadInvestmentHub()]);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const pct = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
  const national = data.snapshot?.national ?? null;
  const best = data.bestYield;
  const hasFigures = !!national && national.median !== null && national.flatPriceFrom !== null;
  return buildSimplePageMetadata({
    locale,
    title: hasFigures ? t("metaTitle", { median: money(national!.median!), from: money(national!.flatPriceFrom!) }) : t("metaTitleShort"),
    description:
      hasFigures && best
        ? t("metaDescription", {
            median: money(national!.median!),
            city: resolveLocalizedString(best.title as never, locale) || best.slug,
            yieldMin: pct(best.grossYield!.min),
            yieldMax: pct(best.grossYield!.max),
            newBuilds: data.newBuilds,
          })
        : t("metaDescriptionShort"),
    pathAfterLocale: INVESTMENT_HUB_PATH,
    locales: INVESTMENT_HUB_LOCALES,
    photo: data.cards[0]?.mainImageUrl ? { url: data.cards[0].mainImageUrl } : undefined,
    robots: { index: true, follow: true },
  });
}

export default async function InvestmentHubPage({ params }: Props) {
  const { locale } = await params;
  if (!INVESTMENT_HUB_LOCALES.includes(locale)) notFound();
  setRequestLocale(locale);
  const data = await loadInvestmentHub();
  return (
    <>
      <InvestmentHubView locale={locale} data={data} />
      <ListingContactBar locale={locale} />
    </>
  );
}
