import { canonicalPropertyImageUrl, propertyImageSeoName, withImageSeoName } from "@/lib/images/propertyImageUrl";
import type { PropertyHomes } from "@/types/propertyHomes";

/**
 * What a listing card needs to show its photos under the same addresses the
 * listing's own page uses. Kept apart from lib/seo/propertyImageAlt so the
 * card — a client component — does not ship the seven-locale alt dictionary.
 */

type CardFacts = Pick<PropertyHomes, "propertyTypeSlug" | "beds" | "districtSlug" | "citySlug">;

export function propertyCardImageSeoName(item: CardFacts): string {
  return propertyImageSeoName({
    typeSlug: item.propertyTypeSlug,
    bedrooms: item.beds,
    districtSlug: item.districtSlug,
    citySlug: item.citySlug,
  });
}

/** The cover photo as JSON-LD and the image sitemap publish it; null without a photo. */
export function propertyCardCanonicalCoverUrl(item: CardFacts & Pick<PropertyHomes, "images">): string | null {
  const src = item.images?.[0]?.src;
  if (!src) return null;
  return canonicalPropertyImageUrl(withImageSeoName(src, propertyCardImageSeoName(item), 1));
}

/**
 * Card alt: the localised listing title, plus the place when the title does
 * not already say it. One string per card — the carousel slides share it, and
 * the per-photo wording belongs to the listing's own page.
 */
export function buildPropertyCardAlt(input: {
  name?: string | null;
  district?: string | null;
  city?: string | null;
}): string {
  const name = (input.name ?? "").trim();
  const haystack = name.toLocaleLowerCase();
  const missing = [input.district, input.city]
    .map((part) => (part ?? "").trim())
    .filter((part, idx, all) => part && all.indexOf(part) === idx)
    .filter((part) => !haystack.includes(part.toLocaleLowerCase()));
  return [name, ...missing].filter(Boolean).join(", ");
}
