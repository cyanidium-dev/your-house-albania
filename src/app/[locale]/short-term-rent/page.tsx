import type { Metadata } from "next";
import { DealTypeLandingPage } from "@/components/deal/DealTypeLandingPage";
import { buildDealTypeLandingMetadata } from "@/lib/sanity/dealLandingPageMeta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildDealTypeLandingMetadata("short-term", locale);
}

export default async function ShortTermRentPage({ params }: Props) {
  const { locale } = await params;
  return <DealTypeLandingPage locale={locale} deal="short-term" />;
}
