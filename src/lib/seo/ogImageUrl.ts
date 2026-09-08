import { getSiteBaseUrl } from '@/lib/siteUrl'

/**
 * Addresses of the social cards `/api/og` draws.
 *
 * Every page used to point `og:image` at whatever photograph it had, cropped
 * to 1200×630 by the Sanity CDN, and the home page pointed at the theme's
 * transparent PNG of a villa in a desert, which the crop turned into a black
 * rectangle with half a roof. A drawn card carries the page's own words on a
 * real photograph, in the language of the link, so the preview says what the
 * page says. The URL is built here so the two sides agree on the parameters.
 */
export const OG_IMAGE_ROUTE = '/api/og'

/** Bump when the drawing changes, so scrapers that cached the old card fetch the new one. */
export const OG_IMAGE_VERSION = '1'

const TITLE_MAX = 140
const SUBTITLE_MAX = 220

function base(): string {
  return getSiteBaseUrl().replace(/\/$/, '')
}

function clip(value: string | undefined, max: number): string | undefined {
  const s = (value ?? '').replace(/\s+/g, ' ').trim()
  if (!s) return undefined
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

/** A listing's card: its cover photo with price, area and layout drawn over it. */
export function propertyOgImageUrl(input: { locale: string; slug: string }): string {
  const params = new URLSearchParams({
    kind: 'property',
    locale: input.locale,
    slug: input.slug,
    v: OG_IMAGE_VERSION,
  })
  return `${base()}${OG_IMAGE_ROUTE}?${params.toString()}`
}

export type LandingOgPhoto =
  /** A key into ALBANIA_PHOTOS — the free-licence photographs that ship with the site. */
  | { key: string }
  /** An absolute image URL on the Sanity CDN, e.g. a landing's card image or a city hero. */
  | { url: string }

/** A page card: title and subtitle over a photograph of the place. */
export function landingOgImageUrl(input: {
  locale: string
  title: string
  subtitle?: string
  photo?: LandingOgPhoto
}): string {
  const params = new URLSearchParams({ kind: 'landing', locale: input.locale, v: OG_IMAGE_VERSION })
  const title = clip(input.title, TITLE_MAX)
  if (title) params.set('title', title)
  const subtitle = clip(input.subtitle, SUBTITLE_MAX)
  if (subtitle) params.set('subtitle', subtitle)
  if (input.photo && 'url' in input.photo && input.photo.url) params.set('photo', input.photo.url)
  else if (input.photo && 'key' in input.photo && input.photo.key) params.set('photoKey', input.photo.key)
  return `${base()}${OG_IMAGE_ROUTE}?${params.toString()}`
}
