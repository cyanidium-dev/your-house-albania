import type { Metadata } from "next";
import { DealTypeLandingPage } from "@/components/deal/DealTypeLandingPage";
import { buildDealTypeLandingMetadata } from "@/lib/sanity/dealLandingPageMeta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildDealTypeLandingMetadata("sale", locale, { investmentPath: true });
}

export default async function InvestmentSalePage({ params }: Props) {
  const { locale } = await params;
  return <DealTypeLandingPage locale={locale} deal="sale" />;
}
