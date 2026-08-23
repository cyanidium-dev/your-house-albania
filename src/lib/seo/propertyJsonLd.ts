/**
 * Builds the JSON-LD graph for a property detail page.
 *
 * Three nodes, each carrying only what its type is allowed to carry:
 *
 *   RealEstateListing  the page — a SearchResultsPage/WebPage subtype, so it
 *                                 describes the listing; it is not the flat.
 *                                 Points at the dwelling with `mainEntity`.
 *   Apartment / House  the dwelling — an Accommodation, which is where
 *                                 floorSize, numberOfRooms, numberOfBedrooms
 *                                 and numberOfBathroomsTotal actually live.
 *   Product            the commerce — the node that reliably carries `offers`.
 *
 * An earlier version hung the dwelling properties off RealEstateListing, which
 * is not in their domain, and set `numberOfRooms` to the bedroom count.
 * See docs/engineering/SPEC-jsonld-and-price-2026-08-23.md.
 */
export type PropertyJsonLdInput = {
  name: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  countryCode?: string | null;
  price?: number | null;
  /** Deal type: "sale" | "rent" | "short-term". Never an availability. */
  status?: string | null;
  /** Lifecycle: "active" | "draft" | "reserved" | "sold" | "rented" | "archived". */
  lifecycleStatus?: string | null;
  /** propertyType slug, e.g. "apartment". Decides the Accommodation subtype. */
  propertyTypeSlug?: string | null;
  /** Total habitable rooms — NOT the bedroom count. */
  rooms?: number;
  beds?: number;
  baths?: number;
  area?: number;
  yearBuilt?: number;
  datePosted?: string | null;
  imageUrls: string[];
  baseUrl: string;
  locale: string;
};

/**
 * Every property price is stored in EUR — `property.currency` was removed from
 * the schema by migrateRemovePropertyCurrency.ts and is null on every document.
 */
const CURRENCY = "EUR";

const SELL = "http://purl.org/goodrelations/v1#Sell";
const LEASE_OUT = "http://purl.org/goodrelations/v1#LeaseOut";

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function toAbsoluteImageUrl(url: string, baseUrl: string): string {
  if (isAbsoluteUrl(url)) return url;
  const base = baseUrl.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

/**
 * schema.org Accommodation subtype per property type, or null when the type is
 * not a dwelling at all. Land and offices get no Accommodation node — their
 * facts ride on Product.additionalProperty instead, which claims nothing about
 * rooms or bedrooms.
 */
const ACCOMMODATION_TYPE: Record<string, string> = {
  apartment: "Apartment",
  studio: "Apartment",
  penthouse: "Apartment",
  house: "House",
  villa: "House",
};

export function accommodationTypeFor(slug?: string | null): string | null {
  if (!slug) return null;
  return ACCOMMODATION_TYPE[slug] ?? null;
}

/**
 * Availability comes from `lifecycleStatus`, never from `status`. `status` is
 * the deal type and its only values are sale / rent / short-term, so the old
 * `status === "sold"` test could never fire and every listing claimed InStock.
 */
const AVAILABILITY: Record<string, string> = {
  sold: "https://schema.org/SoldOut",
  rented: "https://schema.org/LimitedAvailability",
  reserved: "https://schema.org/LimitedAvailability",
};

export function availabilityFor(lifecycleStatus?: string | null): string {
  if (!lifecycleStatus) return "https://schema.org/InStock";
  return AVAILABILITY[lifecycleStatus] ?? "https://schema.org/InStock";
}

function isLease(status?: string | null): boolean {
  const key = status ? status.toLowerCase() : "";
  return key === "rent" || key === "short-term";
}

export function buildOffer(input: {
  price?: number | null;
  status?: string | null;
  lifecycleStatus?: string | null;
  url: string;
}): Record<string, unknown> | undefined {
  const { price, status, lifecycleStatus, url } = input;
  if (typeof price !== "number" || price < 0) return undefined;

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    price,
    priceCurrency: CURRENCY,
    availability: availabilityFor(lifecycleStatus),
    businessFunction: isLease(status) ? LEASE_OUT : SELL,
    url,
  };

  // A rent is per month. Without the unit a crawler reads "€250" as the price
  // of an apartment. The flat `price` stays for readers that ignore the
  // specification, so the number never disappears — it only gains a period.
  if (isLease(status)) {
    offer.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: CURRENCY,
      unitCode: "MON",
      unitText: "month",
    };
  }
  return offer;
}

export function buildPropertyJsonLd(input: PropertyJsonLdInput): object {
  const {
    name,
    slug,
    description,
    location,
    countryCode,
    price,
    status,
    lifecycleStatus,
    propertyTypeSlug,
    rooms,
    beds,
    baths,
    area,
    yearBuilt,
    datePosted,
    imageUrls,
    baseUrl,
    locale,
  } = input;

  const base = baseUrl.replace(/\/$/, "");
  const path = `/${locale}/property/${encodeURIComponent(slug)}`;
  const url = base ? `${base}${path}` : path;

  const images = imageUrls
    .filter((u) => u && typeof u === "string")
    .map((u) => toAbsoluteImageUrl(u, baseUrl));
  const image = images.length > 0 ? (images.length === 1 ? images[0] : images) : undefined;

  const additionalProperty: { "@type": string; name: string; value: number | string }[] = [];
  if (typeof rooms === "number" && rooms > 0) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Rooms", value: rooms });
  }
  if (typeof beds === "number" && beds >= 0) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Bedrooms", value: beds });
  }
  if (typeof baths === "number" && baths >= 0) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Bathrooms", value: baths });
  }
  if (typeof area === "number" && area > 0) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Floor area (m²)", value: area });
  }

  const offers = buildOffer({ price, status, lifecycleStatus, url });

  const address =
    location && location.trim()
      ? {
          "@type": "PostalAddress",
          addressLocality: location.trim(),
          ...(countryCode ? { addressCountry: countryCode } : {}),
        }
      : undefined;

  const accommodationType = accommodationTypeFor(propertyTypeSlug);
  const accommodationId = `${url}#accommodation`;
  const accommodation: Record<string, unknown> | undefined = accommodationType
    ? {
        "@type": accommodationType,
        "@id": accommodationId,
        name: name || "Property",
        ...(address && { address }),
        ...(typeof area === "number" && area > 0
          ? { floorSize: { "@type": "QuantitativeValue", value: area, unitCode: "MTK" } }
          : {}),
        ...(typeof rooms === "number" && rooms > 0 ? { numberOfRooms: rooms } : {}),
        ...(typeof beds === "number" && beds >= 0 ? { numberOfBedrooms: beds } : {}),
        ...(typeof baths === "number" && baths >= 0 ? { numberOfBathroomsTotal: baths } : {}),
        ...(typeof yearBuilt === "number" && yearBuilt > 0 ? { yearBuilt } : {}),
      }
    : undefined;

  const realEstateListing: Record<string, unknown> = {
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    name: name || "Property",
    url,
    ...(description && { description }),
    ...(image && { image }),
    ...(datePosted && { datePosted }),
    ...(accommodation && { mainEntity: { "@id": accommodationId } }),
  };

  const product: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: name || "Property",
    url,
    ...(description && { description }),
    ...(image && { image }),
    ...(offers && { offers }),
    ...(additionalProperty.length > 0 && { additionalProperty }),
    ...(address && { address }),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [realEstateListing, ...(accommodation ? [accommodation] : []), product],
  };
}
