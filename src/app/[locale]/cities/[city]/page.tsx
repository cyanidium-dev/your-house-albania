import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { fetchCityLandingByCitySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const [landing, siteSettings] = await Promise.all([
    fetchCityLandingByCitySlug(citySlug),
    fetchSiteSettings(),
  ]);
  const seo = (landing as { seo?: unknown } | null)?.seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(seo as never, siteDefaultSeo as never, locale);
}

export default async function CityLandingPage({ params }: Props) {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const landing = await fetchCityLandingByCitySlug(citySlug);
  if (!landing) return notFound();
  return <LandingRenderer locale={locale} landing={landing as never} />;
}
