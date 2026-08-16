import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DistrictsBreadcrumb } from "@/components/shared/DistrictsBreadcrumb";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { EntityCard } from "@/components/landing/sections/impl/EntityCard";
import {
  fetchCatalogFilterOptions,
  fetchCityCountrySlugByCitySlug,
  fetchPublishedDistrictsByCity,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { districtInfoPath } from "@/lib/routes/catalog";
import { formatBreadcrumbSlug } from "@/lib/routes/breadcrumbs";

type Props = {
  params: Promise<{ locale: string; country: string; city: string }>;
};

function normalizeSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

async function resolveCityLabel(locale: string, citySlug: string): Promise<string> {
  const { locations } = await fetchCatalogFilterOptions(locale);
  const match = locations.find((l) => l.value.toLowerCase() === citySlug);
  return match?.label || formatBreadcrumbSlug(citySlug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city } = await params;
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    return {};
  }
  const [siteSettings, cityLabel, t] = await Promise.all([
    fetchSiteSettings(),
    resolveCityLabel(locale, citySlug),
    getTranslations("Districts"),
  ]);
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(null, siteDefaultSeo as never, locale, {
    itemTitle: t("hubTitle", { city: cityLabel }),
    itemDescription: t("hubDescription", { city: cityLabel }),
    pathnameForAlternates: `${cmsCountry}/${citySlug}/districts`,
  });
}

export default async function DistrictsHubPage({ params }: Props) {
  const { locale, country, city } = await params;
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  if (!citySlug) notFound();

  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    notFound();
  }

  const districts = await fetchPublishedDistrictsByCity(citySlug);
  if (districts.length === 0) notFound();

  const [cityLabel, t] = await Promise.all([
    resolveCityLabel(locale, citySlug),
    getTranslations("Districts"),
  ]);

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
            {t("hubTitle", { city: cityLabel })}
          </h1>
          <p className="mt-4 text-lg leading-snug text-dark/50 dark:text-white/50">
            {t("hubDescription", { city: cityLabel })}
          </p>
        </div>
        <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
