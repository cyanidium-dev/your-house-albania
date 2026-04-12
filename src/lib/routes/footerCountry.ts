import { isReservedFilterCountrySegment } from "@/lib/routes/catalog";
import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG } from "@/lib/routes/catalogPathPrimitives";

/**
 * First URL segment after locale that matches a Sanity `country` document slug → active country for footer city list.
 * Otherwise falls back to Albania (legacy default for non-geo contexts).
 */
export function deriveFooterCountrySlugFromPathname(
  pathname: string,
  locale: string,
  countrySlugs: readonly string[]
): string {
  const allowed = new Set(countrySlugs.map((s) => s.trim().toLowerCase()).filter(Boolean));
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
  if (parts[0]?.toLowerCase() !== locale.toLowerCase()) {
    return LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
  }
  const seg = parts[1]?.toLowerCase();
  if (!seg) return LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
  if (isReservedFilterCountrySegment(seg)) return LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
  if (allowed.has(seg)) return seg;
  return LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
}
