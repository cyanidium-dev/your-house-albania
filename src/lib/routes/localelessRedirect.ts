/**
 * Where a path that names no locale is sent, permanently.
 *
 * `/blog/x` and `/albania/durres` used to get next-intl's 307 to the visitor's
 * language. Google treats 307 as temporary and keeps the *source* URL: on
 * 2026-09-25 the locale-less address of the Durrës price article ranked 3rd
 * for its query and 129 URLs sat in "page with redirect". A 308 to the default
 * locale says the address is gone; hreflang on the target offers the other
 * languages. The root `/` keeps detection — it is the one address that
 * legitimately varies by visitor.
 *
 * Edge-safe: no imports, the middleware bundles this file.
 */
export function defaultLocaleRedirectTarget(
  pathname: string,
  locales: readonly string[],
  defaultLocale: string,
): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  if (locales.includes(parts[0])) return null;
  return `/${defaultLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
