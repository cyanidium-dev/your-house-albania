import type { Metadata } from "next";
import { DealTypeLandingPage } from "@/components/deal/DealTypeLandingPage";
import { buildDealTypeLandingMetadata } from "@/lib/sanity/dealLandingPageMeta";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

/**
 * Not an index target. The page is the `sale` marketing landing ("Buy Property
 * in Albania: Apartments, Houses and Villas for Sale"), the query the `/sale`
 * hub answers with the listings themselves; Google reported it as crawled but
 * not indexed and kept the hub. It stays in the footer for visitors and passes
 * its links on. An investment page with its own intent belongs at its own URL.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await buildDealTypeLandingMetadata("sale", locale, { investmentPath: true });
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function InvestmentSalePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DealTypeLandingPage locale={locale} deal="sale" />;
}
