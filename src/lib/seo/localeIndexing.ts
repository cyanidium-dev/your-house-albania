import { routing } from "@/i18n/routing";

/**
 * Locales that are live but only partly written.
 *
 * A new locale goes into `routing.locales` the day its interface is translated,
 * but every CMS field that has no value in it falls back to English. Indexing
 * the whole site under that locale would publish a second English copy of the
 * blog, the guides and the knowledge pages. So a partial locale lists the paths
 * whose content does exist in it; everything else under that locale still
 * renders, but is `noindex, follow`, stays out of hreflang and out of the
 * sitemaps and IndexNow.
 *
 * `de` (2026-09-16): interface, listings, cities, districts, catalog SEO copy
 * and city landings are translated; blog posts, guides and knowledge articles
 * are not. Grow the list as sections get German, and drop the entry once the
 * locale is complete.
 */
const PARTIAL_LOCALE_PATHS: Readonly<Record<string, readonly RegExp[]>> = {
  de: [
    /^$/, // home
    /^\/albania(\/.*)?$/, // country, city, district, facet, city and district info pages
    /^\/sale(\/.*)?$/,
    /^\/rent(\/.*)?$/,
    /^\/property\/[^/]+$/,
    /^\/cities(\/[^/]+)?$/,
  ],
};

function normalizePath(pathAfterLocale: string): string {
  const path = pathAfterLocale.split(/[?#]/)[0] ?? "";
  if (path === "" || path === "/") return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "");
}

export function isPartialLocale(locale: string): boolean {
  return Object.prototype.hasOwnProperty.call(PARTIAL_LOCALE_PATHS, locale);
}

/** Whether `/{locale}{pathAfterLocale}` may be indexed. Complete locales: always. */
export function isLocalePathIndexable(locale: string, pathAfterLocale: string): boolean {
  const allowed = PARTIAL_LOCALE_PATHS[locale];
  if (!allowed) return true;
  const path = normalizePath(pathAfterLocale);
  return allowed.some((re) => re.test(path));
}

/**
 * Same check for a site pathname (`/de/albania/durres`) or absolute URL.
 * Paths that do not start with a known locale are left alone.
 */
export function isSitePathIndexable(pathnameOrUrl: string): boolean {
  let pathname = pathnameOrUrl;
  if (/^https?:\/\//i.test(pathnameOrUrl)) {
    try {
      pathname = new URL(pathnameOrUrl).pathname;
    } catch {
      return true;
    }
  }
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match) return true;
  const [, locale, rest = ""] = match;
  if (!(routing.locales as readonly string[]).includes(locale)) return true;
  return isLocalePathIndexable(locale, rest);
}

export const PARTIAL_LOCALE_ROBOTS_HEADER = "noindex, follow";
