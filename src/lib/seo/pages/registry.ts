/**
 * The page families that may be indexable, and the mapping between a page key
 * and its canonical path. URLs are built only through `buildListingPath` so a
 * registry page and a link built anywhere else can never disagree (ADR 003).
 */
import { buildListingPath } from "@/lib/routes/listingRoutes";
import { isListingFacetSlug } from "@/lib/catalog/listingFacets";
import { isSolePublicDealRouteSegment } from "@/lib/catalog/publicDealTypes";
import type { SeoLocale, SeoPageFamily, SeoPageFamilyDefinition, SeoPageKey } from "./types";

export const SEO_PAGE_FAMILIES: Record<SeoPageFamily, SeoPageFamilyDefinition> = {
  city: {
    family: "city",
    urlPattern: "/{locale}/{country}/{city}",
    parent: null,
    copySource: "buildCityListingSeo",
    editorialScope: "city",
    contentSections: [
      "hero", "factsLine", "facetNav", "placeInfoLink", "catalogIntro", "listings", "catalogBottomText",
      "priceStats", "districtLinks", "faq", "buyingCosts",
    ],
    structuredData: ["BreadcrumbList", "ItemList"],
  },
  district: {
    family: "district",
    urlPattern: "/{locale}/{country}/{city}/{district}",
    parent: null,
    copySource: "buildCityDistrictListingSeo",
    editorialScope: "district",
    contentSections: [
      "hero", "factsLine", "facetNav", "placeInfoLink", "catalogIntro", "listings", "catalogBottomText",
      "priceStats", "districtLinks", "faq", "buyingCosts",
    ],
    structuredData: ["BreadcrumbList", "ItemList"],
  },
  cityType: {
    family: "cityType",
    urlPattern: "/{locale}/{country}/{city}/sale/{type}",
    parent: "city",
    copySource: "buildCityTypeListingSeo",
    editorialScope: "city",
    contentSections: ["hero", "listings"],
    structuredData: ["BreadcrumbList", "ItemList"],
  },
  facet: {
    family: "facet",
    urlPattern: "/{locale}/{country}/{city}[/{district}]/{facet}",
    parent: "place",
    copySource: "buildFacetListingSeo",
    editorialScope: "place",
    contentSections: ["hero", "factsLine", "facetNav", "listings"],
    structuredData: ["BreadcrumbList", "ItemList"],
  },
};

const norm = (value: string | null | undefined): string => (typeof value === "string" ? value.trim().toLowerCase() : "");

/** Stable id for logs, maps and tests: `facet:albania/durres/golem-durres/1-1`. */
export function seoPageId(key: SeoPageKey): string {
  switch (key.family) {
    case "city":
      return `city:${key.country}/${key.city}`;
    case "district":
      return `district:${key.country}/${key.city}/${key.district}`;
    case "cityType":
      return `cityType:${key.country}/${key.city}/${key.type}`;
    case "facet":
      return `facet:${key.country}/${key.city}/${key.district ?? ""}/${key.facet}`;
  }
}

/** The page whose inventory a facet or type is compared with, and whose place demand it inherits. */
export function parentSeoPageKey(key: SeoPageKey): SeoPageKey | null {
  switch (key.family) {
    case "city":
      return null;
    case "district":
    case "cityType":
      return { family: "city", country: key.country, city: key.city };
    case "facet":
      return key.district
        ? { family: "district", country: key.country, city: key.city, district: key.district }
        : { family: "city", country: key.country, city: key.city };
  }
}

export function citySeoPageKey(key: SeoPageKey): Extract<SeoPageKey, { family: "city" }> {
  return { family: "city", country: key.country, city: key.city };
}

/** Canonical path of a registry page, `/{locale}/…`, no query. */
export function seoPagePath(key: SeoPageKey, locale: SeoLocale | string): string {
  const common = { scope: "catalog" as const, locale, country: key.country, trustedCityCountrySlug: key.country, city: key.city };
  switch (key.family) {
    case "city":
      return buildListingPath(common);
    case "district":
      return buildListingPath({ ...common, district: key.district });
    case "cityType":
      return buildListingPath({ ...common, dealQuery: "sale", propertyType: key.type });
    case "facet":
      return buildListingPath({ ...common, district: key.district, facet: key.facet });
  }
}

/**
 * The registry key for a resolved listing route, or `null` when the route is a
 * combination no family covers (district + type, a deal other than the sole
 * public one, country omitted, …). A `null` route is never indexable.
 */
export function seoPageKeyFromListingRoute(input: {
  country: string;
  city: string;
  district?: string | null;
  dealSegment?: string | null;
  type?: string | null;
  facet?: string | null;
}): SeoPageKey | null {
  const country = norm(input.country);
  const city = norm(input.city);
  if (!country || !city) return null;
  const district = norm(input.district);
  const deal = norm(input.dealSegment);
  const type = norm(input.type);
  const facet = norm(input.facet);

  if (facet) {
    if (deal || type || !isListingFacetSlug(facet)) return null;
    return district ? { family: "facet", country, city, district, facet } : { family: "facet", country, city, facet };
  }
  if (type) {
    if (district || !deal || !isSolePublicDealRouteSegment(deal)) return null;
    return { family: "cityType", country, city, type };
  }
  if (deal) return null;
  if (district) return { family: "district", country, city, district };
  return { family: "city", country, city };
}

export function sameSeoPageKey(a: SeoPageKey, b: SeoPageKey): boolean {
  return seoPageId(a) === seoPageId(b);
}
