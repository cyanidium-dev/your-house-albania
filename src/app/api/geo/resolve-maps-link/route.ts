import { NextRequest, NextResponse } from 'next/server'
import { isGoogleMapsHost, isPointLocation, parseMapsLink } from '@/lib/geo/parseMapsLink'

/**
 * Follows a short Google Maps link (maps.app.goo.gl/…) for the Studio's
 * "Google Maps link from the realtor" field, which cannot read Google's
 * redirects from the browser. Only a closed list of Google hosts is followed,
 * at most five hops, and nothing is read beyond the redirect headers.
 *
 * GET ?url=<link> → `{ lat, lng, via, finalUrl }` or `{ error, finalUrl? }`.
 * `via: 'viewport'` means the link only gives the centre of the realtor's
 * screen; the Studio refuses that as a pin. A link to a named place often
 * carries no coordinates at all (a name and a feature id); the Studio then
 * asks for a dropped pin.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}
const MAX_HOPS = 5

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

function allowed(u: URL | null): u is URL {
  return !!u && (u.protocol === 'https:' || u.protocol === 'http:') && isGoogleMapsHost(u.hostname)
}

function tryUrl(value: string | null, base?: string): URL | null {
  if (!value) return null
  try {
    return new URL(value, base)
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const start = tryUrl(req.nextUrl.searchParams.get('url'))
  if (!allowed(start)) {
    return NextResponse.json({ error: 'Only Google Maps links are followed.' }, { status: 400, headers: CORS })
  }

  let current = start.toString()
  let best = parseMapsLink(current)
  for (let hop = 0; hop < MAX_HOPS && !isPointLocation(best); hop++) {
    let res: Response
    try {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; domlivo-studio-link-resolver)' },
        signal: AbortSignal.timeout(4000),
      })
    } catch {
      return NextResponse.json({ error: 'Google did not answer.', finalUrl: current }, { status: 502, headers: CORS })
    }
    if (res.status < 300 || res.status >= 400) break
    const next = tryUrl(res.headers.get('location'), current)
    // consent.google.com wraps the real target in ?continue=
    const target = next?.hostname.startsWith('consent.') ? tryUrl(next.searchParams.get('continue')) : next
    if (!allowed(target)) break
    current = target.toString()
    const parsed = parseMapsLink(current)
    if (parsed && (!best || isPointLocation(parsed))) best = parsed
  }

  if (best) return NextResponse.json({ ...best, finalUrl: current }, { headers: CORS })
  return NextResponse.json(
    {
      error:
        'This link names a place but carries no coordinates. Drop a pin on the building in Google Maps and share that link, or click the map.',
      finalUrl: current,
    },
    { headers: CORS },
  )
}
