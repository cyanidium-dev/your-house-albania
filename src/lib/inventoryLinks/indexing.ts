import type { SeoPageDecisionRow } from "@/lib/sanity/queries/seoPages";
import { isSeoPageIndexableIn, seoPageId, seoPageKeyFromListingRoute } from "@/lib/seo/pages";
import type { PlaceTopic } from "./places";

/**
 * Whether the listing page of a place (city, district, or city + type under
 * the sale deal) is one the SEO registry indexes in `locale`. No decisions (a
 * failed fetch) means no link, as on the listing pages themselves.
 */
export function isListingTopicIndexable(
  decisions: readonly SeoPageDecisionRow[] | null | undefined,
  topic: PlaceTopic & { country: string },
  locale: string,
): boolean {
  if (!decisions) return false;
  const key = seoPageKeyFromListingRoute({
    country: topic.country,
    city: topic.city,
    district: topic.district,
    dealSegment: topic.type ? "sale" : undefined,
    type: topic.type,
  });
  if (!key) return false;
  const id = seoPageId(key);
  const row = decisions.find((r) => seoPageId(r.decision.key) === id);
  return !!row && isSeoPageIndexableIn(row.decision, locale);
}
