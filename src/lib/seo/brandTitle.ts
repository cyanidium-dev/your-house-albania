/** One place that owns the "— Domlivo" title brand. */
const BRAND = "Domlivo";
const TRAILING_BRAND = /\s*[|—–-]\s*(Domlivo|Your House Albania)\s*$/i;
// A CMS title can also end in the bare brand word ("Platform for real estate
// agents Domlivo" shipped as "… agents Domlivo — Domlivo"); the word is the
// brand there too and moves to the suffix.
const TRAILING_BARE_BRAND = /\s+Domlivo\s*$/i;
// CMS titles also arrive as "Domlivo — Real estate in Albania" (the home page
// did for months, rendering "Domlivo — … — Domlivo"); a leading brand is
// stripped the same way so the brand appears exactly once, at the end.
const LEADING_BRAND = /^\s*(Domlivo|Your House Albania)\s*[|—–:-]\s*/i;

/** Remove any baked-in brand segment, trailing ("| Domlivo") or leading ("Domlivo — "). */
export function stripBrandSuffix(title: string): string {
  let s = title.trim();
  while (TRAILING_BRAND.test(s)) s = s.replace(TRAILING_BRAND, "").trim();
  if (TRAILING_BARE_BRAND.test(s) && s.toLowerCase() !== BRAND.toLowerCase()) {
    s = s.replace(TRAILING_BARE_BRAND, "").trim();
  }
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

/**
 * Longest catalog title shipped. Google cuts at about 600 px (~60 characters);
 * the CMS titles of `/sale` ran 61–63 in four locales ("Property for Sale in
 * Albania — Apartments, Houses & Beach Homes"), flagged as too long in the
 * audit of 2026-10-18 (T L-9).
 */
export const MAX_LISTING_TITLE_LENGTH = 60;

/** Separators a title is written in segments with, longest-first. */
const TITLE_SEGMENT = /\s+[—–|]\s+/;

/**
 * A catalog title that fits the line: an over-long one loses whole trailing
 * segments ("X — Y — Z" → "X — Y" → "X") until it fits. A title with no
 * segment to drop, or whose first segment alone is too long, ships as written:
 * cutting words mid-phrase would be worse than a truncated snippet.
 */
export function fitListingTitle(title: string): string {
  const clean = stripBrandSuffix(title);
  if (clean.length <= MAX_LISTING_TITLE_LENGTH) return clean;
  const parts = clean.split(TITLE_SEGMENT);
  const seps = clean.match(new RegExp(TITLE_SEGMENT.source, "g")) ?? [];
  for (let keep = parts.length - 1; keep >= 1; keep--) {
    let head = parts[0];
    for (let i = 1; i < keep; i++) head += seps[i - 1] + parts[i];
    if (head.length <= MAX_LISTING_TITLE_LENGTH) return head;
  }
  return clean;
}
