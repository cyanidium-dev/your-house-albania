/**
 * Locale-prefix internal paths for links, matching legacy CTA/marketing behavior.
 * - External http(s), mailto, tel, hash anchors pass through.
 * - Paths already starting with `/${locale}/` (or exactly `/${locale}`) are left as-is
 *   so callers are not double-prefixed.
 * - Leading `/` → `/${locale}${path}`; bare segments → `/${locale}/${segment}`.
 */
export function resolveLocaleHref(href: string, locale: string): string {
  const h = typeof href === 'string' ? href.trim() : ''
  if (!h) return '#'
  if (
    h.startsWith('http://') ||
    h.startsWith('https://') ||
    h.startsWith('mailto:') ||
    h.startsWith('tel:')
  ) {
    return h
  }
  if (h.startsWith('#')) return h
  if (h.startsWith(`/${locale}/`) || h === `/${locale}`) {
    return h
  }
  if (h.startsWith('/')) {
    return `/${locale}${h}`
  }
  return `/${locale}/${h}`
}

/**
 * One rule for every CMS-sourced CTA: trim label and href; if either is empty
 * render nothing; otherwise resolve the href with `resolveLocaleHref`.
 * Returns `null` when the CTA should not render.
 */
export function resolveCta(
  label: unknown,
  href: unknown,
  locale: string,
): { label: string; href: string } | null {
  const l = typeof label === 'string' ? label.trim() : ''
  const h = typeof href === 'string' ? href.trim() : ''
  if (!l || !h) return null
  return { label: l, href: resolveLocaleHref(h, locale) }
}
