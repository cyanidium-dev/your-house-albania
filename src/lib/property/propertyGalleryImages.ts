import { NEAR_SEA_MAX_METERS } from "@/lib/catalog/listingFacets";
import { propertyImageSeoName, withImageSeoName } from "@/lib/images/propertyImageUrl";
import { buildPropertyImageAlt, propertyImageFeatures } from "@/lib/seo/propertyImageAlt";

export type PropertyGalleryFacts = {
  locale: string;
  typeLabel?: string | null;
  typeSlug?: string | null;
  bedrooms?: number | null;
  areaM2?: number | null;
  district?: string | null;
  districtSlug?: string | null;
  city?: string | null;
  citySlug?: string | null;
  deal?: string | null;
  amenitySlugs?: Array<string | null | undefined>;
  beachfront?: boolean | null;
  seaDistanceMeters?: number | null;
  constructionStage?: string | null;
};

/**
 * Turns the CMS gallery into what the page renders: each photo under its
 * readable, locale-independent file name (see lib/images/propertyImageUrl) and
 * with an alt composed in the page locale (see lib/seo/propertyImageAlt).
 *
 * The CMS `alt` is dropped here on purpose — it is a plain string in whatever
 * language the agent typed. `label` stays: it is a caption an editor chose to
 * show, not a description for a crawler.
 */
export function buildPropertyGalleryImages(
  gallery: Array<{ url: string; label?: string }>,
  facts: PropertyGalleryFacts,
): Array<{ url: string; alt: string; label?: string }> {
  const seoName = propertyImageSeoName(facts);
  const features = propertyImageFeatures({ ...facts, nearSeaMaxMeters: NEAR_SEA_MAX_METERS });
  return gallery.map((img, index) => ({
    url: withImageSeoName(img.url, seoName, index + 1),
    alt: buildPropertyImageAlt({ ...facts, index, total: gallery.length, features }),
    ...(img.label?.trim() ? { label: img.label.trim() } : {}),
  }));
}
