import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { loadFonts } from '@/lib/og/fonts'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/client'
import { findIndexCity, type PriceIndexFigures } from '@/lib/priceIndex/snapshot'
import { resolveLocalizedString } from '@/lib/sanity/localized'

/**
 * The Price Index card other sites embed: one city's asking price per m²
 * (band and median), its largest districts and the date, drawn as a PNG.
 *
 *   /api/price-index/card?city=durres&locale=de
 *
 * The embed code on /{locale}/prices wraps it in a plain link and a caption
 * crediting the index (CC BY 4.0). A plain <img> + <a>, not an iframe: links
 * inside an iframe belong to the framed page, not to the article that shows
 * it. Recomputed with the snapshot; cached a day at the edge.
 */

export const runtime = 'nodejs'

const WIDTH = 1200
const HEIGHT = 630
const PRIMARY = '#078660'
const MIN_BAND_FLATS = 5
const MAX_DISTRICTS = 4

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

function resolveLocale(raw: string | null): string {
  return raw && hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
}

export async function GET(req: NextRequest) {
  const locale = resolveLocale(req.nextUrl.searchParams.get('locale'))
  const citySlug = (req.nextUrl.searchParams.get('city') ?? '').trim().toLowerCase()
  const [snapshot, t] = await Promise.all([
    fetchPriceIndexSnapshot(),
    getTranslations({ locale, namespace: 'ZoneMetrics.priceAnswer' }),
  ])
  const city = findIndexCity(snapshot, citySlug)
  // A city under the index's headline sample (30 flats) gets no card: an
  // embedded figure travels without the page's "too little data" note.
  if (!snapshot || !city || !city.reliable || city.median === null) {
    return new Response('Not found', { status: 404 })
  }

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const cityLabel = resolveLocalizedString(city.title as never, locale) || city.slug
  const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(snapshot.computedAt))
  const band = (b: PriceIndexFigures) =>
    b.p20 !== null && b.p80 !== null ? t('range', { from: number.format(b.p20), to: number.format(b.p80) }) : null

  const districts = city.districts
    .filter((d) => d.count >= MIN_BAND_FLATS && d.median !== null)
    .slice(0, MAX_DISTRICTS)
  const maxMedian = Math.max(city.median, ...districts.map((d) => d.median as number))

  const fonts = await loadFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #0b1f19 0%, #0f2e25 60%, #12382c 100%)',
          color: '#ffffff',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 3, color: '#7fd3b4', fontWeight: 700 }}>
            DOMLIVO PRICE INDEX
          </div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>
            {t('title', { city: cityLabel, month })}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 22 }}>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: 700 }}>{band(city) ?? ''}</div>
            <div style={{ display: 'flex', marginLeft: 24, fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>
              {`${t('median', { value: number.format(city.median) })} · ${t('flats', { count: city.count })}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {districts.map((d) => {
            const name = resolveLocalizedString(d.title as never, locale) || d.slug
            const width = Math.max(8, Math.round(((d.median as number) / maxMedian) * 640))
            return (
              <div key={d.slug} style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                <div style={{ display: 'flex', width: 230, fontSize: 26, color: 'rgba(255,255,255,0.85)' }}>{name}</div>
                <div style={{ display: 'flex', width, height: 22, borderRadius: 11, background: PRIMARY }} />
                <div style={{ display: 'flex', marginLeft: 16, fontSize: 26, fontWeight: 700 }}>
                  {`${number.format(d.median as number)} €/m²`}
                </div>
              </div>
            )
          })}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 28,
              fontSize: 22,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <div style={{ display: 'flex' }}>domlivo.com/prices</div>
            <div style={{ display: 'flex' }}>CC BY 4.0</div>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: CACHE_HEADERS },
  )
}
