import type { CatalogSort } from "@/lib/sanity/client";

type SearchParams = Record<string, string | string[] | undefined>;

type RouteFilterParams = {
  agentSlug?: string;
  city?: string;
  district?: string;
};

export type ParsedCatalogFilters = {
  agentSlug: string;
  city: string;
  district: string;
  type: string;
  deal: string;
  sort: CatalogSort;
  amenities: string[];
  pageSize: number;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  beds: number;
  page: number;
};

function normalizePathSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

function pickSearchString(
  searchParams: SearchParams,
  key: string,
  normalize = false
): string {
  const value = searchParams[key];
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return normalize ? normalizePathSegment(trimmed) : trimmed;
}

export function parseCatalogFilters(
  routeParams: RouteFilterParams,
  searchParams: SearchParams
): ParsedCatalogFilters {
  const city = normalizePathSegment(routeParams.city) || pickSearchString(searchParams, "city", true);
  const district = normalizePathSegment(routeParams.district) || pickSearchString(searchParams, "district", true);
  const agentSlug =
    normalizePathSegment(routeParams.agentSlug) || pickSearchString(searchParams, "agent", true);
  const type = pickSearchString(searchParams, "type", true);
  const deal = pickSearchString(searchParams, "deal", true);
  const sortRaw = pickSearchString(searchParams, "sort");
  const sort: CatalogSort =
    sortRaw === "priceAsc" ||
    sortRaw === "priceDesc" ||
    sortRaw === "areaAsc" ||
    sortRaw === "areaDesc" ||
    sortRaw === "newest"
      ? sortRaw
      : "newest";

  const amenitiesRaw = pickSearchString(searchParams, "amenities");
  const amenities = amenitiesRaw
    ? amenitiesRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const pageSize = Number(pickSearchString(searchParams, "pageSize")) || 24;
  const minPrice = Number(pickSearchString(searchParams, "minPrice")) || 0;
  const maxPrice = Number(pickSearchString(searchParams, "maxPrice")) || 0;
  const minArea = Number(pickSearchString(searchParams, "minArea")) || 0;
  const maxArea = Number(pickSearchString(searchParams, "maxArea")) || 0;
  const beds = Number(pickSearchString(searchParams, "beds")) || 0;
  const page = Number(pickSearchString(searchParams, "page")) || 1;

  return {
    agentSlug,
    city,
    district,
    type,
    deal,
    sort,
    amenities,
    pageSize,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    beds,
    page,
  };
}
