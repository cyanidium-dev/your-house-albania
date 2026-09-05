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

/** Absolute title with the brand appended exactly once. */
export function withBrand(title: string): string {
  const clean = stripBrandSuffix(title);
  return clean && clean !== BRAND ? `${clean} — ${BRAND}` : BRAND;
}
