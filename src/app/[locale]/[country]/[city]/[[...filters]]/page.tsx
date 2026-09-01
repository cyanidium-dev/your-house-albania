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
  fetchCatalogProperties,
  fetchCityCountrySlugByCitySlug,
} from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import {
  listingUrlHasQueryParams,
  shouldCatalogListingNoindex,
} from "@/lib/seo/catalogListingMetadata";
import {
  LISTING_DEAL_TYPE_NOINDEX_THRESHOLD,
  LISTING_DISTRICT_NOINDEX_THRESHOLD,
  shouldNoindexEmptyCityListing,
} from "@/lib/seo/listingIndexPolicy";
import { buildCityListingSeo } from "@/lib/seo/listingSeoCopy";
import { stripBrandSuffix } from "@/lib/seo/brandTitle";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { listingOpenGraph, listingTitleField } from "@/lib/seo/listingTitle";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { catalogFilterPath, dealRouteSegmentToQueryValue, isReservedFilterCountrySegment } from "@/lib/routes/catalog";
import { isPublicDealRouteSegment } from "@/lib/catalog/publicDealTypes";
import {
  getGeoListingDistrictNormalizeRedirectUrl,
  getGeoListingDuplicateFacetRedirectUrl,
  mergeListingSearchParams,
  normalizeListingPathSegment,
  resolveCatalogGeoListingInterpretation,
  resolveListingPathFilters,
  resolveOmitCountryListingPathFilters,
} from "@/lib/routes/listingRouteResolver";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ locale: string; country: string; city: string; filters?: string[] }>;
  searchParams: Promise<SearchParams>;
};

function mergedSearchParams(search: SearchParams, dealSegment?: string, propertyType?: string): SearchParams {
  return mergeListingSearchParams(search, dealSegment, propertyType);
}

async function validateListingGeoContent(
  locale: string,
  listingCitySlug: string,
  propertyTypeOptions: { value: string }[],
  propertyType?: string
) {
  const property = await fetchPropertyBySlug(listingCitySlug);
  if (property != null) {
    redirect(`/${locale}/property/${listingCitySlug}`);
  }

  if (!propertyType) return;
  const knownType = propertyTypeOptions.some((t) => t.value.toLowerCase() === propertyType.toLowerCase());
  if (!knownType) notFound();
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, country, city, filters = [] } = await params;
  const search = await searchParams;
  const citySlug = normalizeListingPathSegment(city);
  const countrySlug = normalizeListingPathSegment(country);
  const options = await fetchCatalogFilterOptions(locale);

  if (isReservedFilterCountrySegment(countrySlug)) {
    return {};
  }

  const geo = await resolveCatalogGeoListingInterpretation(countrySlug, citySlug);
  if (!geo) return {};

  const resolved =
    geo.mode === "fullGeo"
      ? resolveListingPathFilters(filters, options.propertyTypes, "geoCity")
      : resolveOmitCountryListingPathFilters(filters, options.propertyTypes, geo.dealSegment);
  if (!resolved) return {};
  const { dealType, propertyType } = resolved;
  const typeSlug = propertyType;

  if (geo.mode === "fullGeo") {
    const cmsCountryMeta = await fetchCityCountrySlugByCitySlug(geo.listingCitySlug);
    if (!cmsCountryMeta || cmsCountryMeta !== geo.listingCountrySlug) {
      return {};
    }
  }

  const [siteSettings, rawSeo] = await Promise.all([
    fetchSiteSettings(),
    fetchCatalogSeoPageByCity(geo.listingCitySlug),
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
  const localizedTitleFromSeo =
    defaultSeo?.metaTitle &&
    resolveLocalizedString(defaultSeo.metaTitle as never, locale);
  // Keyword-driven fallback. Without it the page inherited
  // `Listing.properties.title` — a marketing line with no target keyword —
  // joined to a raw lowercase slug ("… — shengjin").
  const generated = geo.listingCitySlug
    ? await buildCityListingSeo(geo.listingCitySlug, locale)
    : null;
  // stripBrandSuffix: CMS titles often bake in "| Domlivo" — the root template
  // appends the brand, so strip it here to avoid "… | Domlivo — Domlivo".
  // Order matters: a CMS title written in this locale wins, then the generated
  // localized template, and only then the CMS value that fell back to English —
  // an English title on a Polish page costs more than a templated Polish one.
  const title = stripBrandSuffix(
    catalogSeo?.metaTitleInLocale ||
      generated?.title ||
      catalogSeo?.metaTitle ||
      (localizedTitleFromSeo ? `${listTitle} | ${localizedTitleFromSeo}` : listTitle)
  );
  const description =
    catalogSeo?.metaDescriptionInLocale ||
    generated?.description ||
    catalogSeo?.metaDescription ||
    (defaultSeo?.metaDescription
      ? resolveLocalizedString(defaultSeo.metaDescription as never, locale) || listDescription
      : listDescription);

  if (!isIndexingEnabled()) {
    return {
      title: listingTitleField(title),
      description,
      openGraph: listingOpenGraph(title, description),
      robots: indexingDisabledRobots,
    };
  }

  const dealForPath = dealType;
  const path = catalogFilterPath({
    locale,
    city: geo.listingCitySlug,
    ...(geo.mode === "fullGeo"
      ? { country: geo.listingCountrySlug, trustedCityCountrySlug: geo.listingCountrySlug }
      : {}),
    dealType: dealForPath || undefined,
    propertyType: typeSlug || undefined,
    district: typeof search.district === "string" ? search.district : undefined,
  });
  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}${path.split("?")[0]}`;
  const href = buildHreflangAlternates(path.split("?")[0].replace(`/${locale}`, ""));
  const noindexQuery =
    listingUrlHasQueryParams(search) ||
    shouldCatalogListingNoindex(mergedSearchParams(search, dealForPath, typeSlug || undefined), {
      ignoredQueryKeys: ["deal", "type", "district"],
    });
  const seoNoIndex = catalogSeo?.noIndex ?? false;
  let noindexByThreshold = false;
  let noindexByDistrictThreshold = false;
  if (!noindexQuery && !seoNoIndex && dealForPath && typeSlug) {
    const listing = await fetchCatalogProperties({
      city: geo.listingCitySlug,
      deal: dealRouteSegmentToQueryValue(dealForPath),
      type: typeSlug,
      page: 1,
      pageSize: 1,
    });
    const totalCount = listing?.totalCount ?? 0;
    noindexByThreshold = totalCount <= LISTING_DEAL_TYPE_NOINDEX_THRESHOLD;
  }
  if (!noindexQuery && !seoNoIndex && typeof search.district === "string" && search.district.trim()) {
    const listing = await fetchCatalogProperties({
      city: geo.listingCitySlug,
      district: search.district.trim().toLowerCase(),
      page: 1,
      pageSize: 1,
    });
    const totalCount = listing?.totalCount ?? 0;
    noindexByDistrictThreshold = totalCount <= LISTING_DISTRICT_NOINDEX_THRESHOLD;
  }

  // Bare city listing (no deal, type or district): an empty one answers nothing
  // and should not be in the index. Counted with the same fetch the page uses,
  // so robots can never disagree with what the visitor sees. Comes back on its
  // own as soon as the city has inventory.
  let noindexEmptyCity = false;
  const isBareCityListing =
    !dealForPath && !typeSlug && !(typeof search.district === "string" && search.district.trim());
  if (!noindexQuery && !seoNoIndex && isBareCityListing && geo.listingCitySlug) {
    const listing = await fetchCatalogProperties({
      city: geo.listingCitySlug,
      page: 1,
      pageSize: 1,
    });
    noindexEmptyCity = shouldNoindexEmptyCityListing(listing?.totalCount ?? 0);
  }
  // Rentals hidden from the public UI: rent listing pages stay reachable but noindexed.
  const hiddenDeal = Boolean(dealForPath) && !isPublicDealRouteSegment(dealForPath);
  const robots =
    noindexQuery ||
    seoNoIndex ||
    noindexByThreshold ||
    noindexByDistrictThreshold ||
    noindexEmptyCity ||
    hiddenDeal
      ? { index: false as const, follow: true as const }
      : undefined;

  return {
    title: listingTitleField(title),
    description,
    openGraph: listingOpenGraph(title, description),
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function CatalogCityShorthandPage({ params, searchParams }: Props) {
  const [{ locale, country, city, filters = [] }, search] = await Promise.all([params, searchParams]);
  const citySlug = normalizeListingPathSegment(city);
  const countrySlug = normalizeListingPathSegment(country);
  const options = await fetchCatalogFilterOptions(locale);

  const geo = await resolveCatalogGeoListingInterpretation(countrySlug, citySlug);
  if (!geo) notFound();

  const resolved =
    geo.mode === "fullGeo"
      ? resolveListingPathFilters(filters, options.propertyTypes, "geoCity")
      : resolveOmitCountryListingPathFilters(filters, options.propertyTypes, geo.dealSegment);
  if (!resolved) notFound();
  const { dealType, propertyType, dealQuery } = resolved;
  const typeSlug = propertyType;

  await validateListingGeoContent(locale, geo.listingCitySlug, options.propertyTypes, typeSlug || undefined);

  const mergedSearch = mergedSearchParams(search, dealType || undefined, typeSlug || undefined);
  const dupUrl = getGeoListingDuplicateFacetRedirectUrl({
    locale,
    geo,
    dealType,
    propertyType: typeSlug,
    dealQuery,
    search,
  });
  if (dupUrl) redirect(dupUrl);

  const districtUrl = getGeoListingDistrictNormalizeRedirectUrl({
    locale,
    geo,
    dealType,
    propertyType: typeSlug,
    rawSearch: search,
    mergedSearch,
  });
  if (districtUrl) redirect(districtUrl);

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageByCity(geo.listingCitySlug);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  const breadcrumbCountry: string | undefined =
    geo.mode === "fullGeo" ? geo.listingCountrySlug : undefined;

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        citySlug={geo.listingCitySlug}
        propertyType={typeSlug || undefined}
        deal={dealType || undefined}
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            country={breadcrumbCountry}
            city={geo.listingCitySlug}
            dealType={dealType || undefined}
            propertyType={typeSlug || undefined}
          />
        }
      />
      <PropertiesListing
        locale={locale}
        pathCity={geo.listingCitySlug}
        pathCountrySlug={geo.mode === "fullGeo" ? geo.listingCountrySlug : ""}
        omitCountryInPath={geo.mode === "omitCountry"}
        searchParams={mergedSearch}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
