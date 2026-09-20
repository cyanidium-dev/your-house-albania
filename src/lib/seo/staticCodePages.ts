/**
 * Indexable pages that exist only in code — no CMS document behind them, so
 * neither the landing query nor the registry can discover them for a sitemap.
 *
 * `sitemap-static.xml` emits each of these once per locale, with the full set
 * of hreflang alternates. Keep `lastModified` honest: it is the date the page's
 * copy last changed, not the date of the build.
 */
export type StaticCodePage = {
  /** Path after the locale, no leading slash. */
  path: string;
  lastModified: string;
};

export const STATIC_CODE_PAGES: readonly StaticCodePage[] = [
  { path: "about", lastModified: "2026-09-20" },
];

export type StaticCodePageEntry = {
  loc: string;
  lastmod: Date;
  /** hreflang → absolute URL, `x-default` included. */
  alternates: Record<string, string>;
};

export function buildStaticCodePageEntries(
  baseUrl: string,
  locales: readonly string[],
  pages: readonly StaticCodePage[] = STATIC_CODE_PAGES,
): StaticCodePageEntry[] {
  const base = baseUrl.replace(/\/$/, "");
  const entries: StaticCodePageEntry[] = [];
  for (const page of pages) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) alternates[locale] = `${base}/${locale}/${page.path}`;
    // Same rule as `buildHreflangAlternates`: English when it exists.
    const xDefault = locales.includes("en") ? "en" : locales[0];
    if (xDefault) alternates["x-default"] = `${base}/${xDefault}/${page.path}`;
    for (const locale of locales) {
      entries.push({
        loc: alternates[locale],
        lastmod: new Date(page.lastModified),
        alternates,
      });
    }
  }
  return entries;
}
