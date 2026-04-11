import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import {
  fetchAgentBySlug,
  fetchCatalogFilterOptions,
  fetchCatalogSeoPageByCity,
  resolveCatalogSeoPage,
  fetchCityCountrySlugByCitySlug,
} from "@/lib/sanity/client";
import { parseCatalogFilters } from "@/lib/catalog/parseCatalogFilters";
import { agentFilterPath } from "@/lib/routes/catalog";
import {
  getAgentGeoDistrictNormalizeRedirect,
  getAgentGeoPromoteQueryToPathRedirect,
  getAgentGeoPromoteTypeQueryToPathRedirect,
  mergeListingSearchParams,
  normalizeListingPathSegment,
  resolveListingPathFilters,
} from "@/lib/routes/listingRouteResolver";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled, indexingDisabledRobots } from "@/lib/seo/envSeo";
import {
  listingUrlHasQueryParams,
  shouldCatalogListingNoindex,
} from "@/lib/seo/catalogListingMetadata";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{
    locale: string;
    agent: string;
    country: string;
    city: string;
    filters?: string[];
  }>;
  searchParams: Promise<SearchParams>;
};

async function resolveRoute(
  locale: string,
  agent: string,
  country: string,
  city: string,
  filters: string[],
  propertyTypeOptions: { value: string }[]
) {
  const countrySlug = normalizeListingPathSegment(country);
  const agentSlug = normalizeListingPathSegment(agent);
  const citySlug = normalizeListingPathSegment(city);
  const parsed = resolveListingPathFilters(filters, propertyTypeOptions, "agentCity");
  if (!parsed) notFound();

  const { dealType, propertyType, dealQuery } = parsed;

  const agentDoc = await fetchAgentBySlug(agentSlug, locale);
  if (!agentDoc) notFound();

  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) notFound();

  if (propertyType) {
    const knownType = propertyTypeOptions.some((t) => normalizeListingPathSegment(t.value) === propertyType);
    if (!knownType) notFound();
  }

  return { agentSlug, citySlug, dealType, propertyType, dealQuery, agentDoc };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, agent, country, city, filters = [] }, search] = await Promise.all([params, searchParams]);
  const options = await fetchCatalogFilterOptions(locale);
  const resolved = await resolveRoute(locale, agent, country, city, filters, options.propertyTypes);
  const mergedSearch = mergeListingSearchParams(search, resolved.dealType || undefined, resolved.propertyType || undefined);
  const [rawSeo, t] = await Promise.all([
    fetchCatalogSeoPageByCity(resolved.citySlug),
    getTranslations("Listing.properties"),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const title = resolved.agentDoc?.name
    ? `Properties by ${resolved.agentDoc.name} — ${resolved.citySlug.replace(/-/g, " ")}`
    : catalogSeo?.metaTitle || t("title");
  const description = catalogSeo?.metaDescription || t("description");
  if (!isIndexingEnabled()) return { title, description, robots: indexingDisabledRobots };

  const path = agentFilterPath({
    locale,
    agentSlug: resolved.agentSlug,
    country,
    city: resolved.citySlug,
    dealType: resolved.dealType || undefined,
    propertyType: resolved.propertyType || undefined,
  });
  const pathOnly = path.split("?")[0];
  const base = getSiteBaseUrl();
  const href = buildHreflangAlternates(pathOnly.replace(`/${locale}`, ""));
  const robots =
    listingUrlHasQueryParams(search) ||
    shouldCatalogListingNoindex(mergedSearch, {
      ignoredQueryKeys: ["agent", "city", "deal", "type"],
    }) ||
    (catalogSeo?.noIndex ?? false)
      ? { index: false as const, follow: true as const }
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `${base}${pathOnly}`,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function AgentCityCatalogPage({ params, searchParams }: Props) {
  const [{ locale, agent, country, city, filters = [] }, search] = await Promise.all([params, searchParams]);
  const countrySlug = normalizeListingPathSegment(country);
  const options = await fetchCatalogFilterOptions(locale);
  const resolved = await resolveRoute(locale, agent, country, city, filters, options.propertyTypes);

  if (filters.length === 0) {
    const q = getAgentGeoPromoteQueryToPathRedirect({
      locale,
      agentSlug: resolved.agentSlug,
      country,
      citySlug: resolved.citySlug,
      search,
      propertyTypeOptions: options.propertyTypes,
    });
    if (q) redirect(q);
  } else if (filters.length === 1) {
    const q = getAgentGeoPromoteTypeQueryToPathRedirect({
      locale,
      agentSlug: resolved.agentSlug,
      country,
      citySlug: resolved.citySlug,
      dealTypeSegment: resolved.dealType || "",
      search,
      propertyTypeOptions: options.propertyTypes,
    });
    if (q) redirect(q);
  }

  const mergedSearch = mergeListingSearchParams(
    search,
    resolved.dealType || undefined,
    resolved.propertyType || undefined
  );
  const parsed = parseCatalogFilters(
    { agentSlug: resolved.agentSlug, city: resolved.citySlug },
    mergedSearch
  );

  const d = getAgentGeoDistrictNormalizeRedirect({
    locale,
    agentSlug: resolved.agentSlug,
    country,
    citySlug: resolved.citySlug,
    dealType: resolved.dealType || "",
    propertyType: resolved.propertyType || "",
    search: mergedSearch,
    parsedDistrict: parsed.district,
  });
  if (d) redirect(d);

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageByCity(parsed.city);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        agentName={resolved.agentDoc.name}
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            agentSlug={resolved.agentSlug}
            agentName={resolved.agentDoc.name}
            country={countrySlug}
            city={resolved.citySlug}
            dealType={resolved.dealType || undefined}
            propertyType={resolved.propertyType || undefined}
          />
        }
      />
      <PropertiesListing
        locale={locale}
        pathAgentSlug={parsed.agentSlug}
        pathCity={parsed.city}
        pathCountrySlug={countrySlug}
        searchParams={mergedSearch}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
