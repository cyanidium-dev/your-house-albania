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

/**
 * Locales whose address is derived from the English one in code: the Sanity
 * dataset is at its attribute cap, so `localizedSlug.fr` cannot be written
 * (docs/HANDOVER.md). The English address starts with the property type
 * (`apartment-1-1-plazh-durres-42m2`); the derived one swaps that first word
 * (`appartement-1-1-plazh-durres-42m2`) and keeps the rest, which is numbers
 * and place names.
 */
const DERIVED_SLUG_FIRST_WORD: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  fr: { apartment: 'appartement', house: 'maison', land: 'terrain', office: 'bureau' },
}

function derivedSlug(locale: string, localizedSlug?: LocalizedSlug): string | null {
  const words = DERIVED_SLUG_FIRST_WORD[locale]
  const en = localizedSlug?.en
  if (!words || typeof en !== 'string' || !en.trim()) return null
  const [first, ...rest] = en.trim().split('-')
  return [words[first] ?? first, ...rest].join('-')
}

/** The path segment after `/property/` for this locale. */
export function propertyUrlSlug(locale: string, slug: string, localizedSlug?: LocalizedSlug): string {
  const own = localizedSlug?.[locale]
  if (typeof own === 'string' && own.trim()) return own.trim()
  return derivedSlug(locale, localizedSlug) ?? slug
}

/**
 * The English address a derived one came from (`appartement-…` → `apartment-…`),
 * or the slug itself. Passed to GROQ as `$derivedSlug` next to `$slug`.
 */
export function englishSlugOfDerived(slug: string): string {
  const [first, ...rest] = slug.split('-')
  for (const words of Object.values(DERIVED_SLUG_FIRST_WORD)) {
    const en = Object.keys(words).find((k) => words[k] === first)
    if (en && rest.length > 0) return [en, ...rest].join('-')
  }
  return slug
}

/** The GROQ parameters {@link PROPERTY_SLUG_MATCH} reads. */
export function propertySlugParams(slug: string): { slug: string; derivedSlug: string } {
  return { slug, derivedSlug: englishSlugOfDerived(slug) }
}

/** `/{locale}/property/{slug}` — the canonical path of a listing in a locale. */
export function propertyPath(locale: string, slug: string, localizedSlug?: LocalizedSlug): string {
  return `/${locale}/property/${encodeURIComponent(propertyUrlSlug(locale, slug, localizedSlug))}`
}

/**
 * GROQ predicate: the listing answers to `$slug` — its key or any locale's
 * address, stored or derived (`$derivedSlug`, see {@link propertySlugParams}).
 * Used wherever a request's slug is resolved to a listing.
 */
export const PROPERTY_SLUG_MATCH = `(slug.current == $slug || $slug in [${PROPERTY_URL_LOCALES.map(
  (l) => `localizedSlug.${l}`,
).join(', ')}] || localizedSlug.en == $derivedSlug)`
