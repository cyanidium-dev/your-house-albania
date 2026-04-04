import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { CityLandingBreadcrumb } from "@/components/shared/CityLandingBreadcrumb";
import { asSections } from "@/components/landing/sectionRenderers/helpers";
import { fetchCityLandingByCitySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

type CityLandingForMeta = {
  title?: unknown;
  subtitle?: unknown;
  cardDescription?: unknown;
  seo?: unknown;
  linkedCity?: {
    title?: unknown;
    shortDescription?: unknown;
    heroImage?: { asset?: { url?: string } };
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const [landing, siteSettings] = await Promise.all([
    fetchCityLandingByCitySlug(citySlug),
    fetchSiteSettings(),
  ]);
  const seo = (landing as CityLandingForMeta | null)?.seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  const doc = landing as CityLandingForMeta | null;
  const itemTitle =
    resolveLocalizedString(doc?.title as never, locale) ||
    resolveLocalizedString(doc?.linkedCity?.title as never, locale) ||
    citySlug;
  const itemDescription =
    resolveLocalizedString(doc?.subtitle as never, locale) ||
    resolveLocalizedString(doc?.cardDescription as never, locale) ||
    resolveLocalizedString(doc?.linkedCity?.shortDescription as never, locale) ||
    undefined;
  const itemOgImageUrl = doc?.linkedCity?.heroImage?.asset?.url;

  return buildLandingMetadata(seo as never, siteDefaultSeo as never, locale, {
    itemTitle,
    itemDescription,
    itemOgImageUrl,
    pathnameForAlternates: `cities/${citySlug}`,
  });
}

export default async function CityLandingPage({ params }: Props) {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const landing = await fetchCityLandingByCitySlug(citySlug);
  if (!landing) return notFound();

  const sections = asSections(landing as never);
  const hasDedicatedHero = sections[0]?._type === "heroSection";

  if (hasDedicatedHero) {
    return (
      <LandingRenderer
        locale={locale}
        landing={landing as never}
        citySlug={citySlug}
        breadcrumb={<CityLandingBreadcrumb locale={locale} city={citySlug} overHero />}
      />
    );
  }

  return (
    <>
      <section className="pt-20 md:pt-32">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <CityLandingBreadcrumb locale={locale} city={citySlug} />
        </div>
      </section>
      <LandingRenderer locale={locale} landing={landing as never} citySlug={citySlug} />
    </>
  );
}
