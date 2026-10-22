import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import { DistrictsBreadcrumb } from "@/components/shared/DistrictsBreadcrumb";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { balancedGridClass } from "@/components/shared/layout";
import { EntityCard } from "@/components/landing/sections/impl/EntityCard";
import {
  fetchCityCountrySlugByCitySlug,
  fetchCityNameForms,
  fetchPublishedDistrictsByCity,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { districtInfoPath } from "@/lib/routes/catalog";
import { ZonePriceTableAutoSection } from "@/components/landing/sections";
import { ListingPriceIndexSection } from "@/components/landing/sections/ListingPriceIndexSection";
import { fetchLatestZoneMetricsForCityDistricts } from "@/lib/sanity/client";

/**
 * ISR. Two exports, and the route needs both.
 *
 * `generateStaticParams` is empty on purpose: nothing is prerendered at build
 * time, but declaring it is what puts the route on the incremental path.
 * Without it Next has no params to generate, treats the route as fully
 * dynamic and ignores `revalidate` — which is what left the site's ~1,470
 * content URLs answering `no-store` even after the root layout and the
 * request-locale fixes had made the 86 parameterless pages cacheable.
 *
 * The hour is a backstop, not the publishing delay: the Sanity webhook
 * (`/api/revalidate/sanity`) purges the tags a mutated document touches, so an
 * edit reaches the page as soon as the webhook fires.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ locale: string; country: string; city: string }>;
};

function normalizeSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city } = await params;
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    return {};
  }
  const [siteSettings, forms, t] = await Promise.all([
    fetchSiteSettings(),
    fetchCityNameForms(citySlug, locale),
    getTranslations("Districts"),
  ]);
  // "Rrethet e {city}" / "rreth {city}" take the genitive in sq (Tiranës).
  const cityGenitive = forms.genitive || forms.base;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(null, siteDefaultSeo as never, locale, {
    // Searchers type "tirana districts" to compare areas; the title promises
    // the price comparison the page now carries.
    itemTitle: t("hubMetaTitle", { city: cityGenitive }),
    itemDescription: t("hubMetaDescription", { city: cityGenitive }),
    pathnameForAlternates: `${cmsCountry}/${citySlug}/districts`,
  });
}

export default async function DistrictsHubPage({ params }: Props) {
  const { locale, country, city } = await params;
  setRequestLocale(locale);
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  if (!citySlug) notFound();

  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    notFound();
  }

  const districts = await fetchPublishedDistrictsByCity(citySlug);
  if (districts.length === 0) notFound();

  const [forms, t, metrics] = await Promise.all([
    fetchCityNameForms(citySlug, locale),
    getTranslations("Districts"),
    fetchLatestZoneMetricsForCityDistricts({ slug: citySlug }),
  ]);
  const cityGenitive = forms.genitive || forms.base;

  const baseUrl = await getBaseUrl();
  const listItems = districts
    .filter((d) => d.slug)
    .map((d) => ({
      name: resolveLocalizedString(d.title as never, locale) || d.slug!,
      slug: d.slug!,
      href: districtInfoPath(locale, citySlug, d.slug!, cmsCountry),
      image: d.heroImage?.asset?.url ?? null,
    }));

  return (
    <section className="pt-20 md:pt-32 pb-16 md:pb-24">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <ItemListJsonLd items={listItems} baseUrl={baseUrl} locale={locale} />
        <DistrictsBreadcrumb locale={locale} country={cmsCountry} city={citySlug} />
        <div className="max-w-3xl">
          <h1 className="lg:text-52 text-40 leading-[1.2] font-medium text-dark dark:text-white">
            {t("hubTitle", { city: cityGenitive })}
          </h1>
          <p className="mt-4 text-lg leading-snug text-dark/50 dark:text-white/50">
            {t("hubDescription", { city: cityGenitive })}
          </p>
        </div>
        <div className={`mt-10 md:mt-12 ${balancedGridClass(districts.length)}`}>
          {districts.map((d) => {
            const title = resolveLocalizedString(d.title as never, locale) || d.slug || "";
            return (
              <EntityCard
                key={d._id ?? d.slug}
                href={districtInfoPath(locale, citySlug, d.slug!, cmsCountry)}
                title={title}
                imageUrl={d.heroImage?.asset?.url}
                imageAlt={d.heroImage?.alt || title}
                shortDescription={
                  resolveLocalizedString(d.shortDescription as never, locale) || undefined
                }
                count={d.propertiesCount}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                compact
              />
            );
          })}
        </div>
      </div>
      {/* The comparison people came for: researched prices per district, then
          what the live listings ask. */}
      {metrics.length > 0 ? (
        <ZonePriceTableAutoSection locale={locale} records={metrics} sortBy="price" />
      ) : null}
      <ListingPriceIndexSection locale={locale} citySlug={citySlug} />
    </section>
  );
}
