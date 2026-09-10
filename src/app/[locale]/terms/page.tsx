import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { FlatBreadcrumb } from "@/components/shared/FlatBreadcrumb";
import { fetchLandingPageBySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";

/**
 * Terms of Use.
 *
 * Linked from the footer of every page, and for a long time a 404 —
 * the same footer internal links to a page that did not exist. The copy lives in Sanity
 * (`landing-terms`, created by `create:legal-pages` in domlivo-admin) so it
 * can be corrected without a release, which a legal document needs.
 */
const TERMS_LANDING_SLUG = "terms";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [landing, siteSettings] = await Promise.all([
    fetchLandingPageBySlug(TERMS_LANDING_SLUG),
    fetchSiteSettings(),
  ]);
  if (!landing) notFound();
  const landingSeo = (landing as { seo?: unknown }).seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale, {
    pathnameForAlternates: "terms",
    contentUpdatedAt: (landing as { contentUpdatedAt?: string }).contentUpdatedAt,
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const landing = await fetchLandingPageBySlug(TERMS_LANDING_SLUG);
  if (!landing) notFound();
  return (
    <LandingRenderer
      locale={locale}
      landing={landing as never}
      breadcrumb={<FlatBreadcrumb locale={locale} labelKey="terms" path="terms" />}
    />
  );
}
