import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { asSections } from "@/components/landing/sectionRenderers/helpers";
import { DistrictsBreadcrumb } from "@/components/shared/DistrictsBreadcrumb";
import { DistrictPageBody } from "@/components/district/DistrictPageBody";
import { DistrictExploreSection } from "@/components/district/DistrictExploreSection";
import {
  fetchCityCountrySlugByCitySlug,
  fetchDistrictBySlugs,
  fetchDistrictLandingBySlugs,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  params: Promise<{ locale: string; country: string; city: string; district: string }>;
};

function normalizeSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city, district } = await params;
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  const districtSlug = normalizeSegment(district);
  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    return {};
  }
  const [districtDoc, landing, siteSettings] = await Promise.all([
    fetchDistrictBySlugs(citySlug, districtSlug),
    fetchDistrictLandingBySlugs(citySlug, districtSlug),
    fetchSiteSettings(),
  ]);
  if (!districtDoc) {
    return {};
  }
  // District landing SEO wins (same two-level logic as rendering); district doc SEO is the fallback.
  const seo = (landing as { seo?: unknown } | null)?.seo ?? districtDoc.seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  const itemTitle =
    resolveLocalizedString((landing as { title?: unknown } | null)?.title as never, locale) ||
    resolveLocalizedString(districtDoc.heroTitle as never, locale) ||
    resolveLocalizedString(districtDoc.title as never, locale) ||
    districtSlug;
  const itemDescription =
    resolveLocalizedString(
      (landing as { cardDescription?: unknown } | null)?.cardDescription as never,
      locale,
    ) ||
    resolveLocalizedString(districtDoc.shortDescription as never, locale) ||
    resolveLocalizedString(districtDoc.heroSubtitle as never, locale) ||
    undefined;
  return buildLandingMetadata(seo as never, siteDefaultSeo as never, locale, {
    itemTitle,
    itemDescription,
    itemOgImageUrl: districtDoc.heroImage?.asset?.url,
    pathnameForAlternates: `${cmsCountry}/${citySlug}/districts/${districtSlug}`,
    contentUpdatedAt: (landing as { contentUpdatedAt?: string } | null)?.contentUpdatedAt,
  });
}

export default async function DistrictInfoPage({ params }: Props) {
  const { locale, country, city, district } = await params;
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  const districtSlug = normalizeSegment(district);
  if (!citySlug || !districtSlug) notFound();

  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    notFound();
  }

  const districtDoc = await fetchDistrictBySlugs(citySlug, districtSlug);
  if (!districtDoc) notFound();

  const districtLabel =
    resolveLocalizedString(districtDoc.title as never, locale) || districtSlug;
  const cityLabel =
    resolveLocalizedString(districtDoc.city?.title as never, locale) || citySlug;

  const explore = (
    <DistrictExploreSection
      locale={locale}
      countrySlug={cmsCountry}
      citySlug={citySlug}
      cityLabel={cityLabel}
      districtSlug={districtSlug}
      districtLabel={districtLabel}
    />
  );

  // Two-level rendering: dedicated district landing (builder) wins over the fallback template.
  const landing = await fetchDistrictLandingBySlugs(citySlug, districtSlug);
  if (landing) {
    const sections = asSections(landing as never);
    const hasDedicatedHero = sections[0]?._type === "heroSection";
    const breadcrumb = (
      <DistrictsBreadcrumb
        locale={locale}
        country={cmsCountry}
        city={citySlug}
        district={districtSlug}
        districtLabel={districtLabel}
        overHero={hasDedicatedHero}
      />
    );
    if (hasDedicatedHero) {
      return (
        <>
          <LandingRenderer
            locale={locale}
            landing={landing as never}
            citySlug={citySlug}
            breadcrumb={breadcrumb}
          />
          {explore}
        </>
      );
    }
    return (
      <>
        <section className="pt-20 md:pt-32">
          <div className="container mx-auto max-w-8xl px-5 2xl:px-0">{breadcrumb}</div>
        </section>
        <LandingRenderer locale={locale} landing={landing as never} citySlug={citySlug} />
        {explore}
      </>
    );
  }

  return (
    <>
      <DistrictPageBody
        locale={locale}
        countrySlug={cmsCountry}
        citySlug={citySlug}
        district={districtDoc}
      />
      {explore}
    </>
  );
}
