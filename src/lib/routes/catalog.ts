/**
 * Build the catalog base path for a locale.
 * Catalog URLs: /[locale]/properties, /[locale]/properties/[city], /[locale]/properties/[city]/[district]
 */
export function catalogPath(
  locale: string,
  city?: string,
  district?: string
): string {
  const base = `/${locale}/properties`;
  if (!city) {
    if (district) {
      return `${base}?district=${encodeURIComponent(district)}`;
    }
    return base;
  }
  if (!district) return `${base}/${city}`;
  return `${base}/${city}/${district}`;
}
