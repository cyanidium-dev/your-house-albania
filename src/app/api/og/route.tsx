import fs from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { ALBANIA_PHOTOS, DEFAULT_ALBANIA_PHOTO, type AlbaniaPhotoKey } from '@/lib/media/albaniaPhotos'
import { showsPlotArea } from '@/lib/property/plotArea'
import { getClient } from '@/lib/sanity/queries/_core'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { getSiteBaseUrl } from '@/lib/siteUrl'

/**
 * Draws the social card for a page: `og:image` for a listing, a landing, the
 * home page. See lib/seo/ogImageUrl.ts for who links here and why.
 *
 *   /api/og?kind=property&slug=…&locale=ru
 *   /api/og?kind=landing&locale=en&title=…&subtitle=…&photoKey=durres
 *   /api/og?kind=landing&locale=en&title=…&photo=https://cdn.sanity.io/…
 *
 * The listing card is the cover photograph with the price, the floor area,
 * the layout ("Studio", "2+1") and, on a house, the plot written over it in
 * the language of the link. The landing card is the page's title and
 * description over a photograph of the place. Text is set in Inter, which
 * has the Cyrillic and the Albanian letters; the brand face does not.
 */

const WIDTH = 1200
const HEIGHT = 630
const PRIMARY = '#078660'

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

// --- fonts -----------------------------------------------------------------

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'

type FontFace = { name: string; weight: 400 | 700; data: ArrayBuffer; style: 'normal' }

let fontsPromise: Promise<FontFace[]> | null = null

/**
 * Google serves TrueType when the client sends no modern user agent, which
 * is the one format Satori reads without a converter. Fetched once per
 * process and kept; a failed fetch is forgotten so the next request retries.
 */
async function loadFonts(): Promise<FontFace[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const css = await fetch(FONT_CSS, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => {
        if (!r.ok) throw new Error(`font css ${r.status}`)
        return r.text()
      })
      const faces: FontFace[] = []
      const block = /@font-face\s*{([^}]+)}/g
      for (const m of css.matchAll(block)) {
        const body = m[1]
        const weight = /font-weight:\s*(\d+)/.exec(body)?.[1]
        const url = /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/.exec(body)?.[1]
        if (!weight || !url) continue
        if (faces.some((f) => f.weight === Number(weight))) continue
        const data = await fetch(url).then((r) => {
          if (!r.ok) throw new Error(`font file ${r.status}`)
          return r.arrayBuffer()
        })
        faces.push({ name: 'Inter', weight: Number(weight) as 400 | 700, data, style: 'normal' })
      }
      if (!faces.length) throw new Error('no TrueType faces in Google Fonts response')
      return faces
    })().catch((err) => {
      fontsPromise = null
      throw err
    })
  }
  return fontsPromise
}

// --- helpers ---------------------------------------------------------------

function siteBase(): string {
  return getSiteBaseUrl().replace(/\/$/, '')
}

function isSanityUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'cdn.sanity.io'
  } catch {
    return false
  }
}

/** A 1200×630 JPEG crop from the Sanity CDN — Satori reads JPEG and PNG, not AVIF. */
function sanityCrop(url: string): string {
  const [base] = url.split('?')
  return `${base}?w=${WIDTH}&h=${HEIGHT}&fit=crop&fm=jpg&q=78`
}

const stockPhotoCache = new Map<string, Promise<string>>()

/**
 * The site's own photographs, read from `public/` and inlined as a data URL.
 * Read from disk rather than fetched over HTTP: in development the server
 * may sit on any port, and in production the function should not depend on
 * reaching its own domain. next.config.ts traces the folder into the bundle.
 */
function stockPhoto(key: string | null): Promise<string> {
  const photo = key && key in ALBANIA_PHOTOS ? ALBANIA_PHOTOS[key as AlbaniaPhotoKey] : DEFAULT_ALBANIA_PHOTO
  let cached = stockPhotoCache.get(photo.src)
  if (!cached) {
    cached = fs
      .readFile(path.join(process.cwd(), 'public', photo.src))
      .then((buf) => `data:image/jpeg;base64,${buf.toString('base64')}`)
      .catch(() => `${siteBase()}${photo.src}`)
    stockPhotoCache.set(photo.src, cached)
  }
  return cached
}

function resolveLocale(raw: string | null): string {
  return raw && hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
}

function formatEur(value: number, locale: string): string {
  // narrowSymbol: uk and pl spell out "EUR" otherwise, and the card has room for one glyph, not three.
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(value)
}

// --- drawing ---------------------------------------------------------------

/**
 * The header's wordmark — the `siteSettings.logo` the header itself renders,
 * not the theme's leftover SVG under /images/header. The CMS file is drawn
 * for a light ground with no fill set, so it is filled white here for the
 * dark gradient. Fetched once per process; a failure is forgotten so the
 * next request retries, and the card falls back to the name in type.
 */
type Logo = { src: string; width: number; height: number }
let logoPromise: Promise<Logo | null> | null = null
function brandLogo(): Promise<Logo | null> {
  if (!logoPromise) {
    logoPromise = (async () => {
      const client = getClient()
      if (!client) return null
      const asset = await client.fetch<{ url?: string; mimeType?: string; w?: number; h?: number } | null>(
        `*[_type == "siteSettings"][0].logo.asset->{ url, mimeType, "w": metadata.dimensions.width, "h": metadata.dimensions.height }`,
      )
      if (!asset?.url || !isSanityUrl(asset.url)) return null
      const ratio = asset.w && asset.h ? asset.w / asset.h : 7
      const height = 44
      const width = Math.round(height * ratio)
      if (asset.mimeType === 'image/svg+xml') {
        const svg = await fetch(asset.url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`logo ${r.status}`))))
        const white = svg.replace(/<svg\b/, '<svg fill="#ffffff"').replace(/fill="(?!none)[^"]*"/g, 'fill="#ffffff"')
        return { src: `data:image/svg+xml;base64,${Buffer.from(white).toString('base64')}`, width, height }
      }
      return { src: asset.url, width, height }
    })().catch(() => {
      logoPromise = null
      return null
    })
  }
  return logoPromise
}

function Brand({ logo }: { logo: Logo | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.src} alt="" width={logo.width} height={logo.height} style={{ width: logo.width, height: logo.height }} />
      ) : (
        <div style={{ fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>DOMLIVO</div>
      )}
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', paddingLeft: 4 }}>domlivo.com</div>
    </div>
  )
}

function Chip({ children, strong }: { children: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: strong ? '14px 26px' : '12px 22px',
        borderRadius: 999,
        background: strong ? PRIMARY : 'rgba(255,255,255,0.16)',
        border: strong ? 'none' : '1px solid rgba(255,255,255,0.35)',
        color: '#fff',
        fontSize: strong ? 36 : 28,
        fontWeight: strong ? 700 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  )
}

function Card({
  logo,
  photo,
  topRight,
  eyebrow,
  title,
  subtitle,
  chips,
}: {
  logo: Logo | null
  photo: string
  topRight?: string
  eyebrow?: string
  title: string
  subtitle?: string
  chips?: { text: string; strong?: boolean }[]
}) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        position: 'relative',
        fontFamily: 'Inter',
        background: '#0f172a',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt=""
        width={WIDTH}
        height={HEIGHT}
        style={{ position: 'absolute', inset: 0, width: WIDTH, height: HEIGHT, objectFit: 'cover' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          background:
            'linear-gradient(180deg, rgba(5,10,20,0.55) 0%, rgba(5,10,20,0.05) 30%, rgba(5,10,20,0.35) 55%, rgba(5,10,20,0.9) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 56px 48px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand logo={logo} />
          {topRight ? (
            <div
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.92)',
                color: '#0f172a',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {topRight}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {eyebrow ? (
            <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>{eyebrow}</div>
          ) : null}
          <div
            style={{
              fontSize: title.length > 70 ? 46 : 58,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.12,
              letterSpacing: -1,
              maxWidth: 1060,
              display: 'block',
              lineClamp: 3,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 27,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35,
                maxWidth: 1000,
                display: 'block',
                lineClamp: 2,
              }}
            >
              {subtitle}
            </div>
          ) : null}
          {chips?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 6 }}>
              {chips.map((c) => (
                <Chip key={c.text} strong={c.strong}>
                  {c.text}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// --- data ------------------------------------------------------------------

type OgProperty = {
  title?: unknown
  price?: number
  priceUnit?: 'total' | 'per-sqm'
  status?: string
  area?: number
  plotArea?: number
  bedrooms?: number
  typeSlug?: string
  typeTitle?: unknown
  cityTitle?: unknown
  districtTitle?: unknown
  photo?: string
}

const PROPERTY_QUERY = `*[_type == "property" && slug.current == $slug && isPublished == true][0]{
  title, price, priceUnit, status, area, plotArea, bedrooms,
  "typeSlug": type->slug.current,
  "typeTitle": type->title,
  "cityTitle": city->title,
  "districtTitle": district->title,
  "photo": gallery[0].asset->url
}`

async function propertyCard(req: NextRequest, locale: string) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  if (!/^[a-z0-9-]+$/.test(slug)) return new Response('Bad slug', { status: 400 })
  const client = getClient()
  if (!client) return new Response('No CMS', { status: 503 })
  const p = await client.fetch<OgProperty | null>(PROPERTY_QUERY, { slug })
  if (!p) return new Response('Not found', { status: 404 })

  const [t, tMeta] = await Promise.all([
    getTranslations({ locale, namespace: 'Seo.og' }),
    getTranslations({ locale, namespace: 'PropertyMeta' }),
  ])
  const areaUnit = tMeta('areaUnit')

  const typeTitle = resolveLocalizedString(p.typeTitle as never, locale) || ''
  const district = resolveLocalizedString(p.districtTitle as never, locale) || ''
  const city = resolveLocalizedString(p.cityTitle as never, locale) || ''
  const place = [district, city].filter(Boolean).join(', ')
  const isLease = p.status === 'rent' || p.status === 'short-term'
  const deal =
    p.status === 'rent' ? t('forRent') : p.status === 'short-term' ? t('shortTerm') : t('forSale')

  const chips: { text: string; strong?: boolean }[] = []
  if (typeof p.price === 'number' && p.price > 0) {
    const amount = formatEur(p.price, locale)
    chips.push({
      strong: true,
      text:
        p.priceUnit === 'per-sqm'
          ? t('perSqm', { amount })
          : isLease
            ? `${amount}${t('perMonth')}`
            : amount,
    })
  } else {
    chips.push({ strong: true, text: t('priceOnRequest') })
  }
  const roomy = !['land', 'commercial-space', 'office'].includes(p.typeSlug ?? '')
  if (p.typeSlug === 'studio') chips.push({ text: t('studio') })
  else if (roomy && typeof p.bedrooms === 'number' && p.bedrooms > 0) {
    chips.push({ text: t('rooms', { count: p.bedrooms }) })
  }
  if (typeof p.area === 'number' && p.area > 0) chips.push({ text: `${p.area} ${areaUnit}` })
  if (showsPlotArea(p.typeSlug)) {
    chips.push({
      text:
        typeof p.plotArea === 'number' && p.plotArea > 0
          ? t('plot', { value: p.plotArea })
          : t('plotUnknown'),
    })
  }

  const headline = [typeTitle, place].filter(Boolean).join(' · ') || resolveLocalizedString(p.title as never, locale) || 'Domlivo'
  const photo = p.photo && isSanityUrl(p.photo) ? sanityCrop(p.photo) : await stockPhoto(null)

  return new ImageResponse(
    <Card logo={await brandLogo()} photo={photo} topRight={deal} title={headline} chips={chips} />,
    { width: WIDTH, height: HEIGHT, fonts: await loadFonts(), headers: CACHE_HEADERS },
  )
}

async function landingCard(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const title = (q.get('title') ?? '').trim().slice(0, 160) || 'Domlivo'
  const subtitle = (q.get('subtitle') ?? '').trim().slice(0, 240) || undefined
  const photoParam = q.get('photo')
  const photo =
    photoParam && isSanityUrl(photoParam) ? sanityCrop(photoParam) : await stockPhoto(q.get('photoKey'))

  return new ImageResponse(<Card logo={await brandLogo()} photo={photo} title={title} subtitle={subtitle} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts: await loadFonts(),
    headers: CACHE_HEADERS,
  })
}

export async function GET(req: NextRequest) {
  const locale = resolveLocale(req.nextUrl.searchParams.get('locale'))
  const kind = req.nextUrl.searchParams.get('kind')
  try {
    if (kind === 'property') return await propertyCard(req, locale)
    if (kind === 'landing') return await landingCard(req)
    return new Response('Unknown kind', { status: 400 })
  } catch (err) {
    console.error('[api/og]', err instanceof Error ? err.message : err)
    return new Response('Card unavailable', { status: 500 })
  }
}
