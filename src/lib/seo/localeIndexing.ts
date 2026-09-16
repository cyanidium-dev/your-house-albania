import { routing } from "@/i18n/routing";

/**
 * Locales that are live but only partly written.
 *
 * A new locale goes into `routing.locales` the day its interface is translated,
 * but every CMS field that has no value in it falls back to English. Indexing
 * the whole site under that locale would publish a second English copy of the
 * sections nobody translated yet. So a partial locale lists the paths whose
 * content does exist in it; everything else under that locale still renders,
 * but is `noindex, follow`, stays out of hreflang and out of the sitemaps and
 * IndexNow.
 *
 * History: `de` launched this way on 2026-09-16 (home, /albania/**, /sale,
 * /rent, /property/*, /cities) and became complete the same day, once the
 * blog, guides, comparisons and legal pages were translated. Add the next
 * partial locale here the same way, and remove its entry when it is complete.
 */
export type PartialLocalePaths = Readonly<Record<string, readonly RegExp[]>>;

export const PARTIAL_LOCALE_PATHS: PartialLocalePaths = {};

function normalizePath(pathAfterLocale: string): string {
  const path = pathAfterLocale.split(/[?#]/)[0] ?? "";
  if (path === "" || path === "/") return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "");
}

export function isPartialLocale(locale: string, config: PartialLocalePaths = PARTIAL_LOCALE_PATHS): boolean {
  return Object.prototype.hasOwnProperty.call(config, locale);
}

/** Whether `/{locale}{pathAfterLocale}` may be indexed. Complete locales: always. */
export function isLocalePathIndexable(
  locale: string,
  pathAfterLocale: string,
  config: PartialLocalePaths = PARTIAL_LOCALE_PATHS,
): boolean {
  const allowed = config[locale];
  if (!allowed) return true;
  const path = normalizePath(pathAfterLocale);
  return allowed.some((re) => re.test(path));
}

/**
 * Same check for a site pathname (`/de/albania/durres`) or absolute URL.
 * Paths that do not start with a known locale are left alone.
 */
export function isSitePathIndexable(pathnameOrUrl: string, config: PartialLocalePaths = PARTIAL_LOCALE_PATHS): boolean {
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
  return isLocalePathIndexable(locale, rest, config);
}

export const PARTIAL_LOCALE_ROBOTS_HEADER = "noindex, follow";
