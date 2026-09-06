export type CatalogSort =
  | 'newest'
  | 'priceAsc'
  | 'priceDesc'
  | 'areaAsc'
  | 'areaDesc'
  /** Soonest handover first. Only meaningful alongside an unfinished-stage filter. */
  | 'handoverAsc';

/**
 * Where a building is in its life. `unfinished` is not a stored value — it is
 * the filter a buyer actually asks for, "still being built", and covers both
 * off-plan and under-construction.
 */
export type ConstructionStage = 'off-plan' | 'under-construction' | 'completed';
export type ConstructionStageFilter = ConstructionStage | 'unfinished';

export type CatalogFilters = {
  agentSlug?: string;
  city?: string;
  district?: string;
  type?: string;
  deal?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  beds?: number;
  amenities?: string[];
  /** Construction stage; `unfinished` matches off-plan and under-construction. */
  stage?: ConstructionStageFilter;
  /** Only listings the editors marked as suiting an investor. */
  investment?: boolean;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
  /** Property document IDs to exclude (applied before ordering + slicing). */
  excludedPropertyIds?: string[];
};

export type CatalogProperty = {
  _id: string;
  _type: 'property';
  title?: unknown;
  slug?: string;
  /** Short textual teaser/description for list cards. */
  description?: unknown;
  /** Source coordinates in Studio (flat fields). */
  coordinatesLat?: number | null;
  coordinatesLng?: number | null;
  price?: number;
  /** Whether `price` is a total or a per-m2 rate. Absent means total. */
  priceUnit?: 'total' | 'per-sqm';
  currency?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  /** Construction year; used to pick new-vs-resale price range for market position. */
  yearBuilt?: number;
  status?: string;
  promoted?: boolean;
  promotionType?: 'premium' | 'top' | 'sale';
  featuredOrder?: number;
  discountPercent?: number;
  investment?: string;
  constructionStage?: ConstructionStage;
  /** Promised handover; present only while the building is unfinished. */
  handoverYear?: number;
  handoverQuarter?: number;
  documentation?: 'certificate' | 'in-process';
  city?: {
    _id?: string;
    title?: unknown;
    slug?: string;
  };
  district?: {
    _id?: string;
    title?: unknown;
    slug?: string;
    citySlug?: string;
  };
  type?: {
    _id?: string;
    title?: unknown;
    slug?: string;
  };
  mainImageUrl?: string;
  /** All gallery image URLs for card carousel. */
  galleryUrls?: string[];
};

export type CatalogResult = {
  items: CatalogProperty[];
  totalCount: number;
};
