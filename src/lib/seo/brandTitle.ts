/** One place that owns the "— Domlivo" title brand. */
const BRAND = "Domlivo";
const TRAILING_BRAND = /\s*[|—–-]\s*(Domlivo|Your House Albania)\s*$/i;
// CMS titles also arrive as "Domlivo — Real estate in Albania" (the home page
// did for months, rendering "Domlivo — … — Domlivo"); a leading brand is
// stripped the same way so the brand appears exactly once, at the end.
const LEADING_BRAND = /^\s*(Domlivo|Your House Albania)\s*[|—–:-]\s*/i;

/** Remove any baked-in brand segment, trailing ("| Domlivo") or leading ("Domlivo — "). */
export function stripBrandSuffix(title: string): string {
  let s = title.trim();
  while (TRAILING_BRAND.test(s)) s = s.replace(TRAILING_BRAND, "").trim();
  while (LEADING_BRAND.test(s)) s = s.replace(LEADING_BRAND, "").trim();
  return s;
}

/**
 * Longest page title that still gets the brand. Google shows about 60
 * characters; the suffix is 10. On 2026-09-25 ten of sixteen sampled pages ran
 * 63–78 characters, every one because " — Domlivo" had been added to a title
 * already written to fill the line ("Durrës Real Estate: Apartments & Property
 * for Sale"). Past this length the brand is the part that gets cut off anyway,
 * so it is left off and the title ships as written.
 */
export const MAX_TITLE_LENGTH_WITH_BRAND = 50;

/** Absolute title with the brand appended exactly once — or not at all when the title has no room for it. */
export function withBrand(title: string): string {
  const clean = stripBrandSuffix(title);
  if (!clean || clean === BRAND) return BRAND;
  return clean.length > MAX_TITLE_LENGTH_WITH_BRAND ? clean : `${clean} — ${BRAND}`;
}
