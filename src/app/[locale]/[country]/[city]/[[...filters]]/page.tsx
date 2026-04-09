import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import { getTranslations } from "next-intl/server";
import {
  fetchPropertyBySlug,
  fetchSiteSettings,
  fetchCatalogSeoPageByCity,
  resolveCatalogSeoPage,
  fetchCatalogFilterOptions,
} from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { shouldCatalogListingNoindex } from "@/lib/seo/catalogListingMetadata";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import {
  catalogFilterPath,
  dealRouteSegmentToQueryValue,
  getCatalogCountrySlug,
  isReservedFilterCountrySegment,
} from "@/lib/routes/catalog";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ locale: string; country: string; city: string; filters?: string[] }>;
  searchParams: Promise<SearchParams>;
};

function normalizePathSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

function mergedSearchParams(search: SearchParams, dealSegment?: string, propertyType?: string): SearchParams {
  const merged: SearchParams = { ...search };
  const deal = dealRouteSegmentToQueryValue(dealSegment);
  if (deal) merged.deal = deal;
  if (propertyType) merged.type = propertyType;
  return merged;
}

function buildQueryString(search: SearchParams, exclude: string[]): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (exclude.includes(k)) continue;
    if (typeof v === "string") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function resolveGeoSegments(
  filters: string[],
  propertyTypeOptions: { value: string }[]
): { dealType: string; propertyType: string; dealQuery: string } {
  if (filters.length > 2) notFound();
  const first = normalizePathSegment(filters[0]);
  const second = normalizePathSegment(filters[1]);
  const firstDeal = dealRouteSegmentToQueryValue(first || undefined);
  const secondDeal = dealRouteSegmentToQueryValue(second || undefined);

  if (filters.length === 0) {
    return { dealType: "", propertyType: "", dealQuery: "" };
  }

  if (filters.length === 1) {
    if (firstDeal) return { dealType: first, propertyType: "", dealQuery: firstDeal };
    const knownType = propertyTypeOptions.some((t) => normalizePathSegment(t.value) === first);
    if (!knownType) notFound();
    return { dealType: "", propertyType: first, dealQuery: "" };
  }

  // Two-segment canonical form is deal + propertyType.
  if (!firstDeal || secondDeal) notFound();
  const knownType = propertyTypeOptions.some((t) => normalizePathSegment(t.value) === second);
  if (!knownType) notFound();
  return { dealType: first, propertyType: second, dealQuery: firstDeal };
}

const CATALOG_COUNTRY_SLUG = getCatalogCountrySlug();

async function validateRoute(
  locale: string,
  country: string,
  city: string,
  propertyTypeOptions: { value: string }[],
  propertyType?: string
) {
  if (country !== CATALOG_COUNTRY_SLUG || isReservedFilterCountrySegment(country)) {
    notFound();
  }

  const property = await fetchPropertyBySlug(city);
  if (property != null) {
    redirect(`/${locale}/property/${city}`);
  }

  if (!propertyType) return;
  const knownType = propertyTypeOptions.some((t) => t.value.toLowerCase() === propertyType.toLowerCase());
  if (!knownType) notFound();
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, country, city, filters = [] } = await params;
  const search = await searchParams;
  const citySlug = normalizePathSegment(city);
  const countrySlug = normalizePathSegment(country);
  const options = await fetchCatalogFilterOptions(locale);
  const { dealType, propertyType } = resolveGeoSegments(filters, options.propertyTypes);
  const typeSlug = propertyType;

  if (countrySlug !== CATALOG_COUNTRY_SLUG || isReservedFilterCountrySegment(countrySlug)) {
    return {};
  }

  const [siteSettings, rawSeo] = await Promise.all([
    fetchSiteSettings(),
    fetchCatalogSeoPageByCity(citySlug),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const defaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo as
    | {
        metaTitle?: Record<string, string>;
        metaDescription?: Record<string, string>;
      }
    | undefined;
  const t = await getTranslations("Listing.properties");
  const listTitle = t("title");
  const listDescription = t("description");
  const cityTitle = citySlug ? citySlug.replace(/-/g, " ") : "";
  const localizedTitleFromSeo =
    defaultSeo?.metaTitle &&
    resolveLocalizedString(defaultSeo.metaTitle as never, locale);
  const title = catalogSeo?.metaTitle
    ? catalogSeo.metaTitle
    : cityTitle
      ? `${listTitle} — ${cityTitle}`
      : localizedTitleFromSeo
        ? `${listTitle} | ${localizedTitleFromSeo}`
        : listTitle;
  const description =
    catalogSeo?.metaDescription ||
    (defaultSeo?.metaDescription
      ? resolveLocalizedString(defaultSeo.metaDescription as never, locale) || listDescription
      : listDescription);

  if (!isIndexingEnabled()) {
    return { title, description, robots: indexingDisabledRobots };
  }

  const dealForPath = dealType;
  const path = catalogFilterPath({
    locale,
    country: countrySlug,
    city: citySlug,
    dealType: dealForPath || undefined,
    propertyType: typeSlug || undefined,
    district: typeof search.district === "string" ? search.district : undefined,
  });
  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}${path.split("?")[0]}`;
  const href = buildHreflangAlternates(path.split("?")[0].replace(`/${locale}`, ""));
  const noindexQuery = shouldCatalogListingNoindex(
    mergedSearchParams(search, dealForPath, typeSlug || undefined)
  );
  const seoNoIndex = catalogSeo?.noIndex ?? false;
  const robots =
    noindexQuery || seoNoIndex ? { index: false as const, follow: true as const } : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function CatalogCityShorthandPage({ params, searchParams }: Props) {
  const [{ locale, country, city, filters = [] }, search] = await Promise.all([params, searchParams]);
  const citySlug = normalizePathSegment(city);
  const countrySlug = normalizePathSegment(country);
  const options = await fetchCatalogFilterOptions(locale);
  const { dealType, propertyType, dealQuery } = resolveGeoSegments(filters, options.propertyTypes);
  const typeSlug = propertyType;
  await validateRoute(locale, countrySlug, citySlug, options.propertyTypes, typeSlug || undefined);

  const mergedSearch = mergedSearchParams(search, dealType || undefined, typeSlug || undefined);
  const hasDuplicateDeal = typeof search.deal === "string" && normalizePathSegment(search.deal) === (dealQuery || "");
  const hasDuplicateType = typeof search.type === "string" && normalizePathSegment(search.type) === (typeSlug || "");
  if (hasDuplicateDeal || hasDuplicateType) {
    redirect(
      `${catalogFilterPath({
        locale,
        country: countrySlug,
        city: citySlug,
        dealType: dealType || undefined,
        propertyType: typeSlug || undefined,
        district: typeof mergedSearch.district === "string" ? normalizePathSegment(mergedSearch.district) : undefined,
      })}${buildQueryString(mergedSearch, ["deal", "type", "city"])}`
    );
  }
  const district = typeof mergedSearch.district === "string" ? normalizePathSegment(mergedSearch.district) : "";
  if (district && normalizePathSegment(search.district as string) !== district) {
    redirect(
      `${catalogFilterPath({
        locale,
        country: countrySlug,
        city: citySlug,
        dealType: dealType || undefined,
        propertyType: typeSlug || undefined,
        district,
      })}${buildQueryString(mergedSearch, ["district"])}`
    );
  }

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageByCity(citySlug);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            country={countrySlug}
            city={citySlug}
            dealType={dealType || undefined}
            propertyType={typeSlug || undefined}
          />
        }
      />
      <PropertiesListing
        locale={locale}
        pathCity={citySlug}
        searchParams={mergedSearch}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
