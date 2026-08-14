/** One place that owns the "— Domlivo" title brand. */
const BRAND = "Domlivo";
const TRAILING_BRAND = /\s*[|—–-]\s*(Domlivo|Your House Albania)\s*$/i;

/** Remove any baked-in trailing brand segment (CMS titles often carry "| Domlivo"). */
export function stripBrandSuffix(title: string): string {
  let s = title.trim();
  while (TRAILING_BRAND.test(s)) s = s.replace(TRAILING_BRAND, "").trim();
  return s;
}

/** Absolute title with the brand appended exactly once. */
export function withBrand(title: string): string {
  const clean = stripBrandSuffix(title);
  return clean && clean !== BRAND ? `${clean} — ${BRAND}` : BRAND;
}
