/**
 * Builds Product JSON-LD for property detail pages.
 * Uses absolute URLs when base is available.
 */
export type PropertyJsonLdInput = {
  name: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  price?: number | null;
  currency?: string | null;
  status?: string | null;
  beds?: number;
  baths?: number;
  area?: number;
  imageUrls: string[];
  baseUrl: string;
  locale: string;
};

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function toAbsoluteImageUrl(url: string, baseUrl: string): string {
  if (isAbsoluteUrl(url)) return url;
  const base = baseUrl.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

export function buildPropertyJsonLd(input: PropertyJsonLdInput): object {
  const {
    name,
    slug,
    description,
    location,
    price,
    currency,
    status,
    beds,
    baths,
    area,
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
  if (typeof beds === "number" && beds >= 0) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Bedrooms", value: beds });
  }
  if (typeof baths === "number" && baths >= 0) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Bathrooms", value: baths });
  }
  if (typeof area === "number" && area > 0) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Floor area (m²)",
      value: area,
    });
  }

  const numericPrice = typeof price === "number" && price >= 0 ? price : undefined;
  const priceCurrency = typeof currency === "string" && currency ? currency : "EUR";
  const availability =
    status && status.toLowerCase() === "sold"
      ? "https://schema.org/SoldOut"
      : "https://schema.org/InStock";

  const offers =
    numericPrice !== undefined
      ? {
          "@type": "Offer",
          price: numericPrice,
          priceCurrency,
          availability,
          url,
        }
      : undefined;

  const result: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name || "Property",
    url,
    ...(description && { description }),
    ...(image && { image }),
    ...(offers && { offers }),
    ...(additionalProperty.length > 0 && { additionalProperty }),
  };

  if (location && location.trim()) {
    result.address = {
      "@type": "PostalAddress",
      addressLocality: location.trim(),
    };
  }

  return result;
}
