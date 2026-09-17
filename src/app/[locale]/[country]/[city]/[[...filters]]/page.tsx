import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import { ListingPlaceInfoLink } from "@/components/catalog/ListingPlaceInfoLink";
import { ListingFacetNav } from "@/components/catalog/ListingFacetNav";
import { ListingFactsLine } from "@/components/catalog/ListingFactsLine";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import { getTranslations } from "next-intl/server";
import {
  fetchPropertyBySlug,
  fetchSiteSettings,
  fetchCatalogSeoPageByCity,
  fetchCatalogSeoPageByDistrict,
  resolveCatalogSeoPage,
  fetchCatalogFilterOptions,
  fetchCatalogListingStats,
  fetchCityCountrySlugByCitySlug,
  fetchSeoPageDecision,
} from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import {
  listingUrlHasQueryParams,
  shouldCatalogListingNoindex,
} from "@/lib/seo/catalogListingMetadata";
import { isSeoPageIndexableIn, seoPageKeyFromListingRoute } from "@/lib/seo/pages";
import {
  buildCityDistrictListingSeo,
  buildCityListingSeo,
  buildCityTypeListingSeo,
  buildFacetListingSeo,
} from "@/lib/seo/listingSeoCopy";
import { facetCatalogFilters, withFacetQuery, type ListingFacetSlug } from "@/lib/catalog/listingFacets";
import { stripBrandSuffix } from "@/lib/seo/brandTitle";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { listingOpenGraph, listingTitleField } from "@/lib/seo/listingTitle";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { catalogFilterPath, isReservedFilterCountrySegment } from "@/lib/routes/catalog";
import { isPublicDealRouteSegment, isSolePublicDealRouteSegment } from "@/lib/catalog/publicDealTypes";
import { landingOgImageUrl } from "@/lib/seo/ogImageUrl";
import { heroPhotoFor } from "@/lib/media/albaniaPhotos";
import {
  canonicalCatalogGeoListingHref,
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

function mergedSearchParams(
  search: SearchParams,
  dealSegment?: string,
  propertyType?: string,
  district?: string
): SearchParams {
  return mergeListingSearchParams(search, dealSegment, propertyType, district);
}

/** The slugs a first path segment may name as a district of this city. */
function districtSlugsFor(
  options: { districts: { value: string; citySlug?: string }[] },
  citySlug: string
): string[] {
  return options.districts.filter((d) => d.citySlug === citySlug).map((d) => d.value);
}

function districtLabelFor(
  options: { districts: { value: string; label: string }[] },
  districtSlug: string
): string {
  return options.districts.find((d) => d.value.toLowerCase() === districtSlug.toLowerCase())?.label || districtSlug;
}

/**
 * The catalogue copy for the page: the district's own document on a district
 * page — never the city's, whose text is about the whole city — and the
 * city's otherwise.
 */
async function fetchListingSeoDoc(citySlug: string, districtSlug: string) {
  if (districtSlug) return fetchCatalogSeoPageByDistrict(citySlug, districtSlug);
  return fetchCatalogSeoPageByCity(citySlug);
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

type RegistryIndexing = { indexable: boolean; locales: readonly string[] };

/**
 * Whether this listing may be indexed in `locale`, and in which locales it has
 * alternates. The SEO page registry decides (demand, inventory, overlap with
 * its parent, CMS override — docs/seo/README.md); a route that is no registry
 * page, or has no inventory, is never indexable.
 */
async function registryIndexing(input: {
  locale: string;
  countrySlug: string;
  citySlug: string;
  district?: string;
  dealSegment?: string;
  type?: string;
  facet?: string;
}): Promise<RegistryIndexing> {
  const key = seoPageKeyFromListingRoute({
    country: input.countrySlug,
    city: input.citySlug,
    district: input.district,
    dealSegment: input.dealSegment,
    type: input.type,
    facet: input.facet,
  });
  const row = key ? await fetchSeoPageDecision(key) : null;
  if (!row) return { indexable: false, locales: [] };
  return { indexable: isSeoPageIndexableIn(row.decision, input.locale), locales: row.decision.indexableLocales };
}

type FacetPageInput = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  districtSlug?: string;
  districtLabel?: string;
  facet: ListingFacetSlug;
};

/** Count, lowest price and copy for a facet page — shared by metadata and the page. */
async function loadFacetPage(input: FacetPageInput) {
  const stats = await fetchCatalogListingStats({
    city: input.citySlug,
    district: input.districtSlug,
    ...facetCatalogFilters(input.facet),
  });
  const count = stats?.count ?? 0;
  const copy = await buildFacetListingSeo({
    citySlug: input.citySlug,
    districtLabel: input.districtLabel,
    facet: input.facet,
    count,
    priceFrom: stats?.priceFrom ?? null,
    locale: input.locale,
  });
  return { stats, count, copy };
}

async function facetListingMetadata(input: FacetPageInput & { search: SearchParams }): Promise<Metadata> {
  const { copy } = await loadFacetPage(input);
  if (!copy) return {};
  const title = copy.title;
  const description = copy.description;
  const ogImage = landingOgImageUrl({
    locale: input.locale,
    title,
    subtitle: description,
    photo: { key: heroPhotoFor({ citySlug: input.citySlug, propertyType: "apartment", slug: input.citySlug }).key },
  });
  if (!isIndexingEnabled()) {
    return { title: listingTitleField(title), description, openGraph: listingOpenGraph(title, description, ogImage), robots: indexingDisabledRobots };
  }
  const path = catalogFilterPath({
    locale: input.locale,
    country: input.countrySlug,
    trustedCityCountrySlug: input.countrySlug,
    city: input.citySlug,
    district: input.districtSlug,
    facet: input.facet,
  });
  const canonical = `${getSiteBaseUrl()}${path}`;
  const indexing = await registryIndexing({
    locale: input.locale,
    countrySlug: input.countrySlug,
    citySlug: input.citySlug,
    district: input.districtSlug,
    facet: input.facet,
  });
  // A noindexed page declares no alternates: hreflang points only at pages
  // we want indexed, in the locales that have demand for them.
  const href = indexing.indexable ? buildHreflangAlternates(path.replace(`/${input.locale}`, ""), indexing.locales) : undefined;
  // A slice the registry does not index, or a filtered copy of one, stays
  // reachable but out of the index.
  const noindex = listingUrlHasQueryParams(input.search) || !indexing.indexable;
  return {
    title: listingTitleField(title),
    description,
    openGraph: listingOpenGraph(title, description, ogImage, canonical),
    alternates: { canonical, ...(href?.languages ? { languages: href.languages } : {}) },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
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
      ? resolveListingPathFilters(
          filters,
          options.propertyTypes,
          "geoCity",
          districtSlugsFor(options, geo.listingCitySlug)
        )
      : resolveOmitCountryListingPathFilters(filters, options.propertyTypes, geo.dealSegment);
  if (!resolved) return {};
  const { dealType, propertyType, district: pathDistrict, facet } = resolved;
  const typeSlug = propertyType;

  if (geo.mode === "fullGeo") {
    const cmsCountryMeta = await fetchCityCountrySlugByCitySlug(geo.listingCitySlug);
    if (!cmsCountryMeta || cmsCountryMeta !== geo.listingCountrySlug) {
      return {};
    }
  }

  if (facet && geo.mode === "fullGeo") {
    return facetListingMetadata({
      locale,
      search,
      countrySlug: geo.listingCountrySlug,
      citySlug: geo.listingCitySlug,
      districtSlug: pathDistrict || undefined,
      districtLabel: pathDistrict ? districtLabelFor(options, pathDistrict) : undefined,
      facet,
    });
  }

  const [siteSettings, rawSeo] = await Promise.all([
    fetchSiteSettings(),
    fetchListingSeoDoc(geo.listingCitySlug, pathDistrict),
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
  // City + type pages share the city's `catalogSeoPage`, which has no type
  // dimension, so `/durres/sale` and `/durres/sale/apartment` were shipping the
  // same title and description. Type copy is generated per type and wins on
  // those URLs; untyped city pages keep the existing order untouched.
  const generatedType =
    geo.listingCitySlug && typeSlug
      ? await buildCityTypeListingSeo(geo.listingCitySlug, typeSlug, locale)
      : null;
  // District listing: the district's own catalogue copy first, then a
  // localized template naming the district and the city.
  const generatedDistrict = pathDistrict
    ? await buildCityDistrictListingSeo(geo.listingCitySlug, districtLabelFor(options, pathDistrict), locale)
    : null;
  // stripBrandSuffix: CMS titles often bake in "| Domlivo" — the root template
  // appends the brand, so strip it here to avoid "… | Domlivo — Domlivo".
  // Order matters: a CMS title written in this locale wins, then the generated
  // localized template, and only then the CMS value that fell back to English —
  // an English title on a Polish page costs more than a templated Polish one.
  const title = stripBrandSuffix(
    generatedType?.title ||
      catalogSeo?.metaTitleInLocale ||
      generatedDistrict?.title ||
      generated?.title ||
      catalogSeo?.metaTitle ||
      (localizedTitleFromSeo ? `${listTitle} | ${localizedTitleFromSeo}` : listTitle)
  );
  const description =
    generatedType?.description ||
    catalogSeo?.metaDescriptionInLocale ||
    generatedDistrict?.description ||
    generated?.description ||
    catalogSeo?.metaDescription ||
    (defaultSeo?.metaDescription
      ? resolveLocalizedString(defaultSeo.metaDescription as never, locale) || listDescription
      : listDescription);
  // The social card: title and description over a photograph of the city.
  const ogImage = landingOgImageUrl({
    locale,
    title,
    subtitle: description,
    photo: {
      key: heroPhotoFor({ citySlug: geo.listingCitySlug, propertyType: typeSlug, deal: dealType, slug: citySlug }).key,
    },
  });

  if (!isIndexingEnabled()) {
    return {
      title: listingTitleField(title),
      description,
      openGraph: listingOpenGraph(title, description, ogImage),
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
    district: pathDistrict || (typeof search.district === "string" ? search.district : undefined),
  });
  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}${path.split("?")[0]}`;
  const noindexQuery =
    listingUrlHasQueryParams(search) ||
    shouldCatalogListingNoindex(mergedSearchParams(search, dealForPath, typeSlug || undefined), {
      ignoredQueryKeys: ["deal", "type", "district"],
    });
  // Rentals hidden from the public UI: rent listing pages stay reachable but noindexed.
  const hiddenDeal = Boolean(dealForPath) && !isPublicDealRouteSegment(dealForPath);
  // Only the full geo shape can be a registry page; the omit-country shape
  // redirects to it, and a `?district=` copy is a query URL.
  const indexing: RegistryIndexing =
    geo.mode === "fullGeo" && !hiddenDeal
      ? await registryIndexing({
          locale,
          countrySlug: geo.listingCountrySlug,
          citySlug: geo.listingCitySlug,
          district: pathDistrict || undefined,
          dealSegment: dealForPath || undefined,
          type: typeSlug || undefined,
        })
      : { indexable: false, locales: [] };
  const href = indexing.indexable
    ? buildHreflangAlternates(path.split("?")[0].replace(`/${locale}`, ""), indexing.locales)
    : undefined;
  const robots = noindexQuery || !indexing.indexable ? { index: false as const, follow: true as const } : undefined;

  return {
    title: listingTitleField(title),
    description,
    openGraph: listingOpenGraph(title, description, ogImage, canonical),
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
      ? resolveListingPathFilters(
          filters,
          options.propertyTypes,
          "geoCity",
          districtSlugsFor(options, geo.listingCitySlug)
        )
      : resolveOmitCountryListingPathFilters(filters, options.propertyTypes, geo.dealSegment);
  if (!resolved) notFound();
  const { dealType, propertyType, dealQuery, district: pathDistrict, facet } = resolved;
  if (dealType && !isPublicDealRouteSegment(dealType)) notFound();
  if (facet && geo.mode !== "fullGeo") notFound();
  const typeSlug = propertyType;

  await validateListingGeoContent(locale, geo.listingCitySlug, options.propertyTypes, typeSlug || undefined);

  // `/durres/sale/apartment` without the country was a second address for the
  // full geo page; it moves for good wherever the city's country is known.
  if (geo.mode === "omitCountry") {
    const cityCountry = await fetchCityCountrySlugByCitySlug(geo.listingCitySlug);
    if (cityCountry) {
      permanentRedirect(
        canonicalCatalogGeoListingHref({
          locale,
          countrySlug: cityCountry,
          citySlug: geo.listingCitySlug,
          dealTypeSegment: dealType,
          propertyType: typeSlug,
          district: typeof search.district === "string" ? normalizeListingPathSegment(search.district) || undefined : undefined,
          query: search,
          queryExcludeKeys: ["deal", "type", "city", "district"],
        })
      );
    }
  }

  // `/durres/apartment` lists what `/durres/sale/apartment` lists while sale is
  // the only public deal; the typed page has one address, the one with the deal.
  if (geo.mode === "fullGeo" && typeSlug && !dealType && !facet && isSolePublicDealRouteSegment("sale")) {
    permanentRedirect(
      canonicalCatalogGeoListingHref({
        locale,
        countrySlug: geo.listingCountrySlug,
        citySlug: geo.listingCitySlug,
        dealTypeSegment: "sale",
        propertyType: typeSlug,
        district: pathDistrict || undefined,
        query: search,
        queryExcludeKeys: ["deal", "type", "city"],
      })
    );
  }

  // `/durres/sale` and `/durres/golem-durres/sale` duplicated the listing above
  // them while sale is the only public deal (see `isSolePublicDealQuery`);
  // links no longer build them, and anything still pointing there moves for good.
  if (geo.mode === "fullGeo" && dealType && !typeSlug && isSolePublicDealRouteSegment(dealType)) {
    permanentRedirect(
      canonicalCatalogGeoListingHref({
        locale,
        countrySlug: geo.listingCountrySlug,
        citySlug: geo.listingCitySlug,
        dealTypeSegment: dealType,
        propertyType: "",
        district: pathDistrict || undefined,
        query: search,
        queryExcludeKeys: ["deal", "type", "city"],
      })
    );
  }

  const mergedSearch = withFacetQuery(
    mergedSearchParams(search, dealType || undefined, typeSlug || undefined, pathDistrict || undefined),
    facet
  );
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
    pathDistrict: pathDistrict || undefined,
    rawSearch: search,
    mergedSearch,
  });
  if (districtUrl) redirect(districtUrl);

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const districtLabel = pathDistrict ? districtLabelFor(options, pathDistrict) : undefined;
  const facetPage =
    facet && geo.mode === "fullGeo"
      ? await loadFacetPage({
          locale,
          countrySlug: geo.listingCountrySlug,
          citySlug: geo.listingCitySlug,
          districtSlug: pathDistrict || undefined,
          districtLabel,
          facet,
        })
      : null;
  // A facet page carries its own copy; the place's catalogue intro and bottom
  // text would repeat word for word across every slice of the same place.
  const rawSeo = facet ? null : await fetchListingSeoDoc(geo.listingCitySlug, pathDistrict);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const districtCopy = pathDistrict
    ? await buildCityDistrictListingSeo(geo.listingCitySlug, districtLabelFor(options, pathDistrict), locale)
    : null;
  // A typed page ("Apartamente në shitje në Durrës") used to open under the
  // city's heading, so the H1 said less than the <title> did. The heading
  // now carries the same words the tab and the search snippet carry.
  const typedCopy = typeSlug ? await buildCityTypeListingSeo(geo.listingCitySlug, typeSlug, locale) : null;

  const breadcrumbCountry: string | undefined =
    geo.mode === "fullGeo" ? geo.listingCountrySlug : undefined;

  return (
    <>
      <CatalogHero
        title={facetPage?.copy?.title || typedCopy?.title || catalogSeo?.title || districtCopy?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={facetPage?.copy?.description || tCatalog("heroIntroFallback")}
        citySlug={geo.listingCitySlug}
        propertyType={typeSlug || undefined}
        deal={dealType || undefined}
        footer={
          geo.mode === "fullGeo" ? (
            <div className="flex flex-col items-center gap-3">
              <ListingFactsLine
                locale={locale}
                filters={{
                  city: geo.listingCitySlug,
                  district: pathDistrict || undefined,
                  ...(typeSlug ? { type: typeSlug } : {}),
                  ...(facet ? facetCatalogFilters(facet) : {}),
                }}
              />
              {!typeSlug ? (
                <ListingPlaceInfoLink
                  locale={locale}
                  countrySlug={geo.listingCountrySlug}
                  citySlug={geo.listingCitySlug}
                  cityLabel={
                    options.locations.find((l) => l.value.toLowerCase() === geo.listingCitySlug)?.label ||
                    geo.listingCitySlug
                  }
                  districtSlug={pathDistrict || undefined}
                  districtLabel={districtLabel}
                />
              ) : null}
            </div>
          ) : null
        }
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            country={breadcrumbCountry}
            city={geo.listingCitySlug}
            district={pathDistrict || undefined}
            dealType={dealType || undefined}
            propertyType={typeSlug || undefined}
            leaf={facet ? tCatalog(`facetNav.chip.${facet}`) : undefined}
            currentPath={
              facet && geo.mode === "fullGeo"
                ? catalogFilterPath({
                    locale,
                    country: geo.listingCountrySlug,
                    trustedCityCountrySlug: geo.listingCountrySlug,
                    city: geo.listingCitySlug,
                    district: pathDistrict || undefined,
                    facet,
                  })
                : undefined
            }
          />
        }
      />
      {geo.mode === "fullGeo" && !typeSlug ? (
        <ListingFacetNav
          locale={locale}
          countrySlug={geo.listingCountrySlug}
          citySlug={geo.listingCitySlug}
          districtSlug={pathDistrict || undefined}
          currentFacet={facet}
          placeLabel={
            (districtLabel ? `${districtLabel}, ` : "") +
            (options.locations.find((l) => l.value.toLowerCase() === geo.listingCitySlug)?.label || geo.listingCitySlug)
          }
        />
      ) : null}
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
