import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from './rootLocale'

/**
 * Browser-side helpers for moving the visitor to another language version of
 * the page they are on.
 *
 * The page's own `hreflang` links are the authority on where its translation
 * lives: they know the per-locale property slugs (`/ru/property/kvartira-…`
 * vs `/en/property/apartment-…`) and which pages exist in one language only.
 * Swapping the locale segment of the path is the fallback for pages that
 * declare no alternates.
 */

/** The path of this page's version in `locale`, from its hreflang links. */
export function alternatePathFor(locale: string): string | null {
  if (typeof document === 'undefined') return null
  const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${locale}"]`)
  const href = link?.getAttribute('href')
  if (!href) return null
  try {
    // The links are absolute production URLs; only the path is wanted, so the
    // switch stays on whatever host this is (preview, localhost).
    return new URL(href, window.location.href).pathname
  } catch {
    return null
  }
}

/**
 * Where switching to `locale` should go: the translated path, plus the query
 * and hash of the current URL. Filters, the catalogue page and the currency
 * used to be dropped on a language switch (audit 2026-10-13).
 */
export function localeSwitchHref(locale: string, internalPathname: string): string {
  const path =
    alternatePathFor(locale) ??
    `/${locale}${internalPathname === '/' ? '' : internalPathname}`
  return `${path}${window.location.search}${window.location.hash}`
}

/**
 * Remembers an explicit choice for a year, so the bare domain opens in it
 * next time. Written here because these switches navigate with the plain
 * Next router rather than next-intl's, which would otherwise write it.
 */
export function rememberLocale(locale: string): void {
  try {
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
  } catch {
    // Cookies blocked: the switch still happens, it just is not remembered.
  }
}

/** The remembered choice, if the visitor ever made one. */
export function rememberedLocale(): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]+)`))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

/** The first of the browser's languages the site has, by language subtag. */
export function preferredSiteLocale(locales: readonly string[]): string | null {
  if (typeof navigator === 'undefined') return null
  const list = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of list) {
    const base = tag?.toLowerCase().split('-')[0]
    if (base && locales.includes(base)) return base
  }
  return null
}
