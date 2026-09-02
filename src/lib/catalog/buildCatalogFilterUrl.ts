import { buildListingUrl, type BuildListingUrlInput } from "@/lib/routes/listingRoutes";
import { interpretPriceRangeState, getPriceQueryParams } from "@/lib/catalog/priceRanges";
import { interpretAreaRangeState, getAreaQueryParams } from "@/lib/catalog/areaRanges";

function districtSlugForPath(d: string | undefined): string | undefined {
  if (!d || d === "any") return undefined;
  return d;
}

export type CatalogFilterUrlState = {
  locale: string;
  currentSearch: string;
  type: string;
  effectiveDeal: string;
  priceTuple: [number, number];
  priceRangesByDeal: Record<string, { min: number; max: number }>;
  areaValues: [number, number];
  defaultAreaRange: { min: number; max: number };
  beds: string;
  stage: string;
  sort: string;
  amenities: string[];
  pageSize: string;
  city: string;
  district: string;
  initialAgentSlug: string;
  initialCountrySlug: string;
  locations: { value: string; countrySlug?: string }[];
};

export function buildCatalogFilterUrl(state: CatalogFilterUrlState): string {
  const {
    locale,
    currentSearch,
    type,
    effectiveDeal,
    priceTuple,
    priceRangesByDeal,
    areaValues,
    defaultAreaRange,
    beds,
    stage,
    sort,
    amenities,
    city,
    district,
    initialAgentSlug,
    initialCountrySlug,
    locations,
  } = state;

  const rangeForDeal =
    priceRangesByDeal[effectiveDeal || "any"] ||
    priceRangesByDeal.any || { min: 0, max: 1_000_000 };
  const priceStateForApply = interpretPriceRangeState(
    { min: priceTuple[0], max: priceTuple[1] },
    rangeForDeal
  );

  const params = new URLSearchParams(currentSearch);

  if (type) params.set("type", type);
  else params.delete("type");

  if (effectiveDeal && effectiveDeal !== "any") params.set("deal", effectiveDeal);
  else params.delete("deal");

  const priceParams = getPriceQueryParams(priceStateForApply);
  if (priceParams.minPrice) params.set("minPrice", priceParams.minPrice);
  else params.delete("minPrice");
  if (priceParams.maxPrice) params.set("maxPrice", priceParams.maxPrice);
  else params.delete("maxPrice");

  const areaStateForApply = interpretAreaRangeState(
    { min: areaValues[0], max: areaValues[1] },
    defaultAreaRange
  );
  const areaParams = getAreaQueryParams(areaStateForApply);
  if (areaParams.minArea) params.set("minArea", areaParams.minArea);
  else params.delete("minArea");
  if (areaParams.maxArea) params.set("maxArea", areaParams.maxArea);
  else params.delete("maxArea");

  if (beds && beds !== "any") params.set("beds", beds);
  else params.delete("beds");

  if (stage && stage !== "any") params.set("stage", stage);
  else params.delete("stage");

  if (sort && sort !== "newest") params.set("sort", sort);
  else params.delete("sort");

  if (amenities.length > 0) params.set("amenities", amenities.join(","));
  else params.delete("amenities");

  // pageSize is an internal/API concern only (infinite scroll). Never expose it in browser URLs.
  params.delete("pageSize");

  // View mode is UI preference (localStorage), not part of search/filter query
  params.delete("view");
  params.delete("page");
  params.delete("city");
  // District is a query facet; `buildListingUrl` adds `?district=` when needed (do not duplicate in params)
  params.delete("district");

  const citySlug = city || undefined;
  const typeSlug = type || undefined;
  const countryFromSelection = locations.find((l) => l.value === citySlug)?.countrySlug;
  const listingInput: BuildListingUrlInput = {
    locale,
    scope: initialAgentSlug ? "agent" : "catalog",
    agentSlug: initialAgentSlug || undefined,
    country: initialCountrySlug.trim() || undefined,
    trustedCityCountrySlug: countryFromSelection,
    city: citySlug,
    dealQuery:
      effectiveDeal && effectiveDeal !== "any" ? effectiveDeal : undefined,
    propertyType: typeSlug,
    district: districtSlugForPath(district),
    query: params,
  };
  return buildListingUrl(listingInput);
}
