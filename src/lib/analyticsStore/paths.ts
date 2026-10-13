/**
 * Paths as the analytics store keeps them: the pathname only, so a visit, a
 * lead's landing page and a Search Console row about the same page meet on
 * the same string.
 *
 * - no origin, query string or fragment (they can carry personal data, and
 *   they would split one page into many rows);
 * - no trailing slash except for the root;
 * - repeated slashes collapsed, percent escapes upper-cased;
 * - at most {@link MAX_PATH} characters, from a fixed URL-safe alphabet.
 */

import { routing } from '@/i18n/routing'

export const MAX_PATH = 200

/** Characters a percent-encoded pathname can contain (RFC 3986 pchar plus "/"). */
const PATH_CHARS = /^[A-Za-z0-9\-._~%!$&'()*+,;=:@/]+$/

/**
 * Normalises a same-site path. Returns `null` for anything that is not one:
 * absolute or protocol-relative URLs, whitespace, control or non-ASCII
 * characters (a browser's `location.pathname` is always percent-encoded).
 */
export function normalizePath(input: unknown): string | null {
  if (typeof input !== 'string') return null
  let p = input
  const cut = p.search(/[?#]/)
  if (cut >= 0) p = p.slice(0, cut)
  if (!p.startsWith('/') || p.startsWith('//')) return null
  if (!PATH_CHARS.test(p)) return null
  p = p.replace(/\/{2,}/g, '/').replace(/%[0-9a-fA-F]{2}/g, (m) => m.toUpperCase())
  if (p.length > MAX_PATH) {
    // Do not leave half an escape at the end of a truncated path.
    p = p.slice(0, MAX_PATH).replace(/%[0-9A-F]?$/, '')
  }
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p || '/'
}

/**
 * The path of a full URL (Search Console reports pages as absolute URLs, on
 * both the apex and `www`). `new URL` percent-encodes non-ASCII, so a page
 * reported with Cyrillic in it lands on the same string the browser sends.
 */
export function pathFromUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url) return null
  if (url.startsWith('/')) return normalizePath(url)
  try {
    return normalizePath(new URL(url).pathname)
  } catch {
    return null
  }
}

const LOCALES = routing.locales as readonly string[]

/** The site locale a path is under, or `''` (the root, API paths, typos). */
export function localeOfPath(path: string): string {
  const m = /^\/([a-z]{2})(?:\/|$)/.exec(path)
  return m && LOCALES.includes(m[1]) ? m[1] : ''
}
