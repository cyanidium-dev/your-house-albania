import type { Metadata } from "next";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import HeroSub from "@/components/shared/HeroSub";
import BlogSmall from "@/components/shared/Blog";
import {
  fetchHomeLanding,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { getTranslations } from "next-intl/server";
import { SiteJsonLd } from "@/components/shared/SiteJsonLd";
import { getSiteBaseUrl } from "@/lib/siteUrl";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (process.env.NODE_ENV === "development") {
    console.log("[HOMEPAGE CANONICAL ROUTE ACTIVE][generateMetadata]", { locale });
  }
  const [landing, siteSettings] = await Promise.all([fetchHomeLanding(), fetchSiteSettings()]);

  const landingSeo = (landing as { seo?: unknown } | null)?.seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale, {
    pathnameForAlternates: "",
    contentUpdatedAt: (landing as { contentUpdatedAt?: string } | null)?.contentUpdatedAt,
  });
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (process.env.NODE_ENV === "development") {
    console.log("[HOMEPAGE CANONICAL ROUTE ACTIVE][page]", { locale });
  }

  const landing = await fetchHomeLanding();
  const siteSettings = await fetchSiteSettings();
  const baseUrl = getSiteBaseUrl();
  const siteLogoUrl =
    (siteSettings as { logo?: { asset?: { url?: string } } } | null)?.logo?.asset?.url ||
    undefined;
  // Organization contact + sameAs come from the CMS; both were modelled but
  // never passed, so contactPhone/companyAddress had no consumer at all.
  const rawSettings = siteSettings as {
    contactEmail?: string;
    contactPhone?: string;
    socialLinks?: { url?: string }[];
  } | null;
  const sameAs = (rawSettings?.socialLinks ?? [])
    .map((s) => s?.url?.trim())
    .filter((u): u is string => Boolean(u));
  const contactEmail = rawSettings?.contactEmail?.trim();
  const contactPhone = rawSettings?.contactPhone?.trim();
  const siteJsonLd = (
    <SiteJsonLd
      baseUrl={baseUrl}
      locale={locale}
      brandName="Domlivo"
      legalName="Domlivo — Real estate in Albania"
      logoUrl={siteLogoUrl}
      sameAs={sameAs.length > 0 ? sameAs : undefined}
      contactPoint={
        contactEmail || contactPhone
          ? { email: contactEmail, telephone: contactPhone, contactType: 'customer support' }
          : undefined
      }
      searchUrlTemplate="/catalog?q={search_term_string}"
    />
  );

  if (!landing) {
    const t = await getTranslations("Home.blog");
    return (
      <main>
        {siteJsonLd}
        <HeroSub
          title={t("title")}
          description={t("description")}
          badge={t("badge")}
        />
        <BlogSmall locale={locale} />
      </main>
    );
  }
  return (
    <>
      {siteJsonLd}
      <LandingRenderer locale={locale} landing={landing as never} />
    </>
  );
}
