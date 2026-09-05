/**
 * `landingPage.locales` — "show this landing only in these locales". Empty or
 * absent means every locale, so every landing that existed before the field
 * keeps its behaviour. Added for SEO-04 (Polish-only guides); SEO-11/15 reuse it.
 */
export type LocaleScoped = { locales?: unknown }

export function landingLocales(doc: LocaleScoped | null | undefined): string[] {
  const raw = doc?.locales
  if (!Array.isArray(raw)) return []
  return raw
    .map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : ''))
    .filter(Boolean)
}

export function isLandingInLocale(doc: LocaleScoped | null | undefined, locale: string): boolean {
  const scope = landingLocales(doc)
  if (!scope.length) return true
  return scope.includes(String(locale || '').trim().toLowerCase())
}
