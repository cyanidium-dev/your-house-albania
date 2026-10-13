/**
 * Which locale the bare domain sends a visitor to.
 *
 * next-intl negotiates `Accept-Language` on `/` but falls back to the default
 * locale, Albanian, for every browser language the site does not have: a
 * French, Spanish or Dutch visitor landed on /sq (audit 2026-10-13), while the
 * hreflang `x-default` already names /en as the page for everyone else. This
 * keeps next-intl's behaviour for the seven site languages and makes English
 * the fallback, matching `x-default`.
 *
 * Only the language subtag is compared: `de-AT` and `de-CH` are German,
 * `sq-XK` Albanian. Entries are tried in the browser's own order of
 * preference (`q`), ties keeping their written order.
 */
export function negotiateRootLocale(
  acceptLanguage: string | null | undefined,
  locales: readonly string[],
  fallback: string,
): string {
  if (!acceptLanguage) return fallback
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
      const weight = q ? Number(q.slice(2)) : 1
      return { tag: tag.trim().toLowerCase(), weight: Number.isFinite(weight) ? weight : 0, index }
    })
    .filter((e) => e.tag && e.tag !== '*' && e.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (locales.includes(base)) return base
  }
  return fallback
}

/** One year: an explicit language choice should outlive the browser session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
