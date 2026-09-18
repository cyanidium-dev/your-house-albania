/**
 * Property URLs, one per locale.
 *
 * A listing has one internal key, `slug` (Sanity `slug.current`) — favourites,
 * leads, analytics and the AI all use it — and, since 2026-09-18, an address
 * per language in `localizedSlug`, built from its facts in that language
 * (domlivo-admin scripts/lib/propertyUrlSlug.ts):
 *
 *   /en/property/apartment-2-1-plazh-durres-85m2
 *   /ru/property/kvartira-2-1-plazh-durres-85m2
 *
 * Before that every language shared the key, so an English page could live at
 * a Russian transliteration and a Russian page at the partner's Albanian title.
 *
 * Every slug a listing has answers: the property page looks the listing up by
 * any of them and redirects to the one for the requested locale. A listing
 * without `localizedSlug` (new in Studio, not yet run through the script) keeps
 * its key as its address in every language.
 */

export type LocalizedSlug = Partial<Record<string, string | null | undefined>> | null | undefined

export const PROPERTY_URL_LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const

/** The path segment after `/property/` for this locale. */
export function propertyUrlSlug(locale: string, slug: string, localizedSlug?: LocalizedSlug): string {
  const own = localizedSlug?.[locale]
  return typeof own === 'string' && own.trim() ? own.trim() : slug
}

/** `/{locale}/property/{slug}` — the canonical path of a listing in a locale. */
export function propertyPath(locale: string, slug: string, localizedSlug?: LocalizedSlug): string {
  return `/${locale}/property/${encodeURIComponent(propertyUrlSlug(locale, slug, localizedSlug))}`
}

/**
 * GROQ predicate: the listing answers to `$slug` — its key or any locale's
 * address. Used wherever a request's slug is resolved to a listing.
 */
export const PROPERTY_SLUG_MATCH = `(slug.current == $slug || $slug in [${PROPERTY_URL_LOCALES.map(
  (l) => `localizedSlug.${l}`,
).join(', ')}])`
