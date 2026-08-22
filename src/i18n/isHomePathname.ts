import { routing } from './routing'

/**
 * True for `/`, `/{locale}` and `/{locale}/` — the homepage in any configured
 * locale. Segment-based (no regex) so adding a locale to `routing.ts` is the
 * only change ever needed.
 */
export function isHomePathname(
  pathname: string,
  locales: readonly string[] = routing.locales,
): boolean {
  if (!pathname) return false
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return pathname.startsWith('/')
  return segments.length === 1 && locales.includes(segments[0]!)
}
