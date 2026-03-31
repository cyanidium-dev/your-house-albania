import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { fetchLandingPageBySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";

/** Must match `slug.current` on the Sanity `landingPage` document for this page. */
const FOR_REALTORS_LANDING_SLUG = "for-realtors";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [landing, siteSettings] = await Promise.all([
    fetchLandingPageBySlug(FOR_REALTORS_LANDING_SLUG),
    fetchSiteSettings(),
  ]);
  if (!landing) {
    notFound();
  }
  const landingSeo = (landing as { seo?: unknown }).seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale);
}

export default async function ForRealtorsPage({ params }: Props) {
  const { locale } = await params;
  const landing = await fetchLandingPageBySlug(FOR_REALTORS_LANDING_SLUG);
  if (!landing) {
    notFound();
  }
  return <LandingRenderer locale={locale} landing={landing as never} />;
}
