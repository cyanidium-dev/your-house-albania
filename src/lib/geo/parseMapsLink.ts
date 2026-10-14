/**
 * Reads coordinates out of whatever a realtor pastes as "the location":
 * a Google Maps link (place, dropped pin, directions, search), an
 * OpenStreetMap link, plain "41.3123, 19.4512" or degrees-minutes-seconds
 * (41°18'44.3"N 19°27'04.3"E).
 *
 * Short links (maps.app.goo.gl, goo.gl/maps) carry no coordinates; they have
 * to be followed first: src/app/api/geo/resolve-maps-link follows them.
 * Same rules as the Studio copy in domlivo-admin `lib/geo/parseMapsLink.ts`.
 *
 * A Google link can hold several coordinate pairs. Best first:
 *   `!3d…!4d…`             the place itself (lat, lng)
 *   `/maps/search/lat,lng`  a dropped pin
 *   `!1d…!2d…`             the directions destination (lng, lat — reversed)
 *   `q=` / `query=` / `destination=` / `daddr=`, OSM `mlat=&mlon=`
 *   `ll=` / `center=` / `@lat,lng` / OSM `#map=z/lat/lng`: only the centre of
 *   the screen the realtor was looking at, NOT a point — `via: 'viewport'`,
 *   which the Studio refuses to take as the realtor's pin.
 */

export type ParsedLocation = {
  lat: number
  lng: number
  via: 'place' | 'pin' | 'destination' | 'query' | 'viewport' | 'plain' | 'dms'
}

const NUM = '(-?\\d{1,3}\\.\\d+)'
const SEP = '(?:,|%2C)\\+?\\s*'

type Pattern = {via: ParsedLocation['via']; re: RegExp; lngFirst?: boolean}

const PATTERNS: Pattern[] = [
  {via: 'place', re: new RegExp(`!3d${NUM}!4d${NUM}`)},
  {via: 'pin', re: new RegExp(`/maps/search/${NUM}${SEP}${NUM}`)},
  {via: 'pin', re: new RegExp(`/maps/place/${NUM}${SEP}${NUM}`)},
  // directions: the last waypoint is the destination; Google writes it lng first
  {via: 'destination', re: new RegExp(`!1d${NUM}!2d${NUM}(?!.*!1d)`), lngFirst: true},
  {via: 'query', re: new RegExp(`[?&](?:q|query|destination|daddr)=(?:loc:)?${NUM}${SEP}${NUM}`, 'i')},
  {via: 'query', re: new RegExp(`[?&]mlat=${NUM}&mlon=${NUM}`, 'i')},
  {via: 'viewport', re: new RegExp(`[?&](?:ll|sll|center)=${NUM}${SEP}${NUM}`, 'i')},
  {via: 'viewport', re: new RegExp(`@${NUM},${NUM}`)},
  {via: 'viewport', re: new RegExp(`#map=\\d+(?:\\.\\d+)?/${NUM}/${NUM}`)},
  {via: 'plain', re: new RegExp(`^\\s*${NUM}\\s*[,; ]\\s*${NUM}\\s*$`)},
]

const DMS = /(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)["″]?\s*([NS])[\s,]+(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)["″]?\s*([EW])/i

function valid(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
}

export function parseMapsLink(input: string | null | undefined): ParsedLocation | null {
  if (!input) return null
  let text = input.trim()
  try {
    text = decodeURIComponent(text)
  } catch {
    // keep the raw text
  }
  for (const {via, re, lngFirst} of PATTERNS) {
    const m = text.match(re)
    if (m) {
      const lat = Number(lngFirst ? m[2] : m[1])
      const lng = Number(lngFirst ? m[1] : m[2])
      if (valid(lat, lng)) return {lat, lng, via}
    }
  }
  const d = text.match(DMS)
  if (d) {
    const lat = (Number(d[1]) + Number(d[2]) / 60 + Number(d[3]) / 3600) * (/s/i.test(d[4]) ? -1 : 1)
    const lng = (Number(d[5]) + Number(d[6]) / 60 + Number(d[7]) / 3600) * (/w/i.test(d[8]) ? -1 : 1)
    if (valid(lat, lng)) return {lat, lng, via: 'dms'}
  }
  return null
}

/** A point someone actually chose, as opposed to the centre of their screen. */
export function isPointLocation(p: ParsedLocation | null): p is ParsedLocation {
  return !!p && p.via !== 'viewport'
}

/**
 * Hosts the resolver is allowed to follow. A closed list, not a pattern: the
 * endpoint must never fetch a host Google does not own.
 */
const GOOGLE_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'g.co',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'consent.google.com',
  'www.google.al',
  'maps.google.al',
  'google.al',
  'www.google.it',
  'www.google.de',
  'www.google.co.uk',
  'www.google.fr',
  'www.google.gr',
  'www.google.pl',
  'www.google.com.ua',
  'www.google.ru',
])

export function isGoogleMapsHost(host: string): boolean {
  return GOOGLE_HOSTS.has(host.toLowerCase())
}
