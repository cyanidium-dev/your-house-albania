export type CatalogSort =
  | 'newest'
  | 'priceAsc'
  | 'priceDesc'
  | 'areaAsc'
  | 'areaDesc';

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
  currency?: string;
  area?: number;
  bedrooms?: number;
  rooms?: number;
  bathrooms?: number;
  status?: string;
  promoted?: boolean;
  promotionType?: 'premium' | 'top' | 'sale';
  featuredOrder?: number;
  discountPercent?: number;
  investment?: string;
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
