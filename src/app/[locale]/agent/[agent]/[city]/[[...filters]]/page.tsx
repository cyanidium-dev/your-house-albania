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
} from "@/lib/sanity/client";
import { parseCatalogFilters } from "@/lib/catalog/parseCatalogFilters";
import {
  agentFilterPath,
  dealRouteSegmentToQueryValue,
} from "@/lib/routes/catalog";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled, indexingDisabledRobots } from "@/lib/seo/envSeo";
import { shouldCatalogListingNoindex } from "@/lib/seo/catalogListingMetadata";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ locale: string; agent: string; city: string; filters?: string[] }>;
  searchParams: Promise<SearchParams>;
};

function normalizePathSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
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

function mergeSearch(search: SearchParams, deal?: string, propertyType?: string): SearchParams {
  const merged: SearchParams = { ...search };
  if (deal) merged.deal = deal;
  if (propertyType) merged.type = propertyType;
  return merged;
}

async function resolveRoute(
  locale: string,
  agent: string,
  city: string,
  filters: string[]
) {
  const [dealSegment, propertyTypeSegment] = filters;
  const agentSlug = normalizePathSegment(agent);
  const citySlug = normalizePathSegment(city);
  const dealType = normalizePathSegment(dealSegment);
  const propertyType = normalizePathSegment(propertyTypeSegment);
  const dealQuery = dealRouteSegmentToQueryValue(dealType || undefined);
  if (dealSegment && !dealQuery) notFound();
  if (filters.length > 2) notFound();

  const agentDoc = await fetchAgentBySlug(agentSlug, locale);
  if (!agentDoc) notFound();

  if (propertyType) {
    const options = await fetchCatalogFilterOptions(locale);
    const knownType = options.propertyTypes.some(
      (t) => normalizePathSegment(t.value) === propertyType
    );
    if (!knownType) notFound();
  }

  return { agentSlug, citySlug, dealType, propertyType, dealQuery, agentDoc };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, agent, city, filters = [] }, search] = await Promise.all([params, searchParams]);
  const resolved = await resolveRoute(locale, agent, city, filters);
  const mergedSearch = mergeSearch(search, resolved.dealQuery, resolved.propertyType || undefined);
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
    city: resolved.citySlug,
    dealType: resolved.dealType || undefined,
    propertyType: resolved.propertyType || undefined,
  });
  const base = getSiteBaseUrl();
  const href = buildHreflangAlternates(path.replace(`/${locale}`, ""));
  const robots =
    shouldCatalogListingNoindex(mergedSearch) || (catalogSeo?.noIndex ?? false)
      ? { index: false as const, follow: true as const }
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `${base}${path}`,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function AgentCityCatalogPage({ params, searchParams }: Props) {
  const [{ locale, agent, city, filters = [] }, search] = await Promise.all([params, searchParams]);
  const resolved = await resolveRoute(locale, agent, city, filters);
  const mergedSearch = mergeSearch(search, resolved.dealQuery, resolved.propertyType || undefined);
  const parsed = parseCatalogFilters(
    { agentSlug: resolved.agentSlug, city: resolved.citySlug },
    mergedSearch
  );

  const district = parsed.district;
  if (district && normalizePathSegment(search.district as string) !== district) {
    const normalizedPath = agentFilterPath({
      locale,
      agentSlug: resolved.agentSlug,
      city: resolved.citySlug,
      dealType: resolved.dealType || undefined,
      propertyType: resolved.propertyType || undefined,
      district,
    });
    redirect(`${normalizedPath}${buildQueryString(mergedSearch, ["district"])}`);
  }

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
        searchParams={mergedSearch}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
