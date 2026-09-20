import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { FlatBreadcrumb } from "@/components/shared/FlatBreadcrumb";
import { fetchLandingPageBySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { prepareLegalLanding } from "@/lib/legal/legalLanding";
import {
  BUSINESS_TELEGRAM_URL,
  BUSINESS_WHATSAPP_URL,
} from "@/lib/contacts/businessContacts";
import { BUSINESS_EMAIL } from "@/lib/contacts/businessEmail";

/**
 * Privacy Policy.
 *
 * Linked from the footer of every page and from the cookie consent banner, and for a long time a 404 —
 * 2,591 internal links to a page that did not exist. The copy lives in Sanity
 * (`landing-privacy`, created by `create:legal-pages` in domlivo-admin) so it
 * can be corrected without a release, which a legal document needs.
 */
const PRIVACY_LANDING_SLUG = "privacy";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [landing, siteSettings] = await Promise.all([
    fetchLandingPageBySlug(PRIVACY_LANDING_SLUG),
    fetchSiteSettings(),
  ]);
  if (!landing) notFound();
  const landingSeo = (landing as { seo?: unknown }).seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale, {
    pathnameForAlternates: "privacy",
    contentUpdatedAt: (landing as { contentUpdatedAt?: string }).contentUpdatedAt,
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rawLanding = await fetchLandingPageBySlug(PRIVACY_LANDING_SLUG);
  if (!rawLanding) notFound();
  const t = await getTranslations("Legal");
  // The CMS copy still carries `TODO(legal)` markers for facts only the owner
  // can supply. They are handled at render time (see `legalLanding.ts`, which
  // keeps the list of what is still open) and the title becomes the page's h1.
  const landing = prepareLegalLanding(rawLanding, {
    // `t.raw`: the {email}/{whatsapp}/{telegram} placeholders are turned into
    // links by the block builder, not interpolated by next-intl.
    operatorTemplate: t.raw("operatorNotice") as string,
    contacts: {
      email: BUSINESS_EMAIL,
      whatsappUrl: BUSINESS_WHATSAPP_URL,
      telegramUrl: BUSINESS_TELEGRAM_URL,
    },
  });
  return (
    <LandingRenderer
      locale={locale}
      landing={landing as never}
      breadcrumb={<FlatBreadcrumb locale={locale} labelKey="privacy" path="privacy" />}
    />
  );
}
