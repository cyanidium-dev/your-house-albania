/**
 * Renders the "Buying in Durrës" lead-magnet guide to seven static PDFs, one
 * per locale, at build time — never per request (the Hobby plan's CPU budget
 * could not carry it, see the `/api/og` history). The site only ever serves
 * the files from `public/guides/`.
 *
 *   npx tsx scripts/buildDurresGuidePdf.ts            # all locales
 *   npx tsx scripts/buildDurresGuidePdf.ts --locale de
 *   npx tsx scripts/buildDurresGuidePdf.ts --price-index ../domlivo-admin-seo/scripts/data/price-index/durres-2026-09.json
 *
 * Sources:
 *   scripts/data/durres-guide/<locale>.md      the text, with {{placeholders}}
 *   scripts/data/durres-guide/price-index.json  live asking-price stats (a copy of
 *                                              domlivo-admin `scripts/data/price-index/durres-2026-09.json`)
 *   scripts/data/durres-guide/fonts/Inter-Regular.ttf  embedded as a subset (OFL, see NOTICE.txt)
 *
 * The rates in the cost section come from `src/lib/property/ownershipCosts.ts`,
 * the same constants the property pages charge, so the guide and the site
 * cannot disagree. Every other figure is written in the Markdown with its
 * source, from the research knowledge base.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_THEME, layoutGuide } from '../src/lib/guides/pdf/layout'
import { parseMarkdown, substitute } from '../src/lib/guides/pdf/markdown'
import { PdfDocument } from '../src/lib/guides/pdf/writer'
import { GUIDE_LOCALES, GUIDE_PRICE_INDEX_AS_OF, guidePdfFileName, type GuideLocale } from '../src/lib/guides/durresGuide'
import { PURCHASE_COST_RATES, computePurchaseCosts } from '../src/lib/property/ownershipCosts'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const dataDir = resolve(root, 'scripts/data/durres-guide')
const outDir = resolve(root, 'public/guides')

type Stat = {
  listings: number
  flats: number
  flatPriceFrom: number | null
  medianFlatPrice: number | null
  medianPerSqm: number | null
  perSqmSample: number
}

type PriceIndex = {
  asOf: string
  city: Stat
  byBedrooms: Record<string, Stat>
  districts: Array<Stat & { slug: string; title: string }>
  nearSea300m: Stat & { seaDataKnownFlats: number }
  newBuild: Stat
  priceBands: { under60k: number; from60to100k: number; from100to150k: number; from150k: number; pricedAsTotal: number }
}

/** Per-locale strings the PDF metadata and chrome need outside the Markdown body. */
const CHROME: Record<GuideLocale, { title: string; subject: string; footer: string; pageLabel: string; keywords: string }> = {
  en: {
    title: 'Buying in Durrës: prices, taxes, steps',
    subject: 'A guide for foreign buyers of flats in Durrës, Albania — September 2026',
    footer: 'Domlivo, September 2026. Asking prices from live listings, not sale prices. Not legal advice.',
    pageLabel: 'Page {page} of {pages}',
    keywords: 'Durrës, Albania, property, apartment, buying guide, taxes, notary',
  },
  sq: {
    title: 'Blerja në Durrës: çmime, taksa, hapa',
    subject: 'Udhëzues për blerësit e huaj të apartamenteve në Durrës — shtator 2026',
    footer: 'Domlivo, shtator 2026. Çmime kërkimi nga listimet aktive, jo çmime shitjeje. Nuk është këshillë ligjore.',
    pageLabel: 'Faqja {page} nga {pages}',
    keywords: 'Durrës, Shqipëri, pronë, apartament, udhëzues blerjeje, taksa, noter',
  },
  uk: {
    title: 'Купівля в Дуррес: ціни, податки, кроки',
    subject: 'Посібник для іноземних покупців квартир у місті Дуррес, Албанія — вересень 2026',
    footer: 'Domlivo, вересень 2026. Ціни пропозиції з активних оголошень, а не ціни угод. Не є юридичною консультацією.',
    pageLabel: 'Сторінка {page} з {pages}',
    keywords: 'Дуррес, Албанія, нерухомість, квартира, посібник покупця, податки, нотаріус',
  },
  ru: {
    title: 'Покупка в Дуррес: цены, налоги, шаги',
    subject: 'Гид для иностранных покупателей квартир в городе Дуррес, Албания — сентябрь 2026',
    footer: 'Domlivo, сентябрь 2026. Цены предложения из активных объявлений, а не цены сделок. Не является юридической консультацией.',
    pageLabel: 'Страница {page} из {pages}',
    keywords: 'Дуррес, Албания, недвижимость, квартира, гид покупателя, налоги, нотариус',
  },
  it: {
    title: 'Comprare a Durazzo: prezzi, tasse, passaggi',
    subject: 'Guida per acquirenti stranieri di appartamenti a Durazzo, Albania — settembre 2026',
    footer: 'Domlivo, settembre 2026. Prezzi richiesti dagli annunci attivi, non prezzi di vendita. Non è una consulenza legale.',
    pageLabel: 'Pagina {page} di {pages}',
    keywords: 'Durazzo, Albania, immobili, appartamento, guida all’acquisto, tasse, notaio',
  },
  pl: {
    title: 'Kupno w Durrës: ceny, podatki, kroki',
    subject: 'Przewodnik dla zagranicznych nabywców mieszkań w Durrës, Albania — wrzesień 2026',
    footer: 'Domlivo, wrzesień 2026. Ceny ofertowe z aktywnych ogłoszeń, nie ceny transakcyjne. To nie jest porada prawna.',
    pageLabel: 'Strona {page} z {pages}',
    keywords: 'Durrës, Albania, nieruchomości, mieszkanie, przewodnik kupującego, podatki, notariusz',
  },
  de: {
    title: 'Kaufen in Durrës: Preise, Steuern, Schritte',
    subject: 'Leitfaden für ausländische Käufer von Wohnungen in Durrës, Albanien — September 2026',
    footer: 'Domlivo, September 2026. Angebotspreise aus aktiven Inseraten, keine Verkaufspreise. Keine Rechtsberatung.',
    pageLabel: 'Seite {page} von {pages}',
    keywords: 'Durrës, Albanien, Immobilien, Wohnung, Kaufleitfaden, Steuern, Notar',
  },
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function formatters(locale: GuideLocale) {
  const intlLocale = locale === 'sq' ? 'sq-AL' : locale
  const nf = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 })
  const num = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? nf.format(n) : '—')
  const pct = (n: number) => new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 }).format(n)
  const pct2 = (n: number) => new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(n)
  const date = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
  const monthYear = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
  return { num, pct, pct2, date, monthYear }
}

function statFields(stat: Stat, f: ReturnType<typeof formatters>) {
  return {
    listings: f.num(stat.listings),
    flats: f.num(stat.flats),
    flatPriceFrom: f.num(stat.flatPriceFrom),
    medianFlatPrice: f.num(stat.medianFlatPrice),
    medianPerSqm: f.num(stat.medianPerSqm),
    perSqmSample: f.num(stat.perSqmSample),
  }
}

/** Everything a `{{placeholder}}` in the Markdown may refer to. */
export function placeholderData(index: PriceIndex, locale: GuideLocale): Record<string, unknown> {
  const f = formatters(locale)
  const districts: Record<string, unknown> = {}
  for (const d of index.districts) districts[d.slug] = { ...statFields(d, f), title: d.title }
  const beds: Record<string, unknown> = {}
  for (const [key, stat] of Object.entries(index.byBedrooms)) beds[key] = statFields(stat, f)

  const median = index.city.medianFlatPrice ?? 0
  const example = computePurchaseCosts(median)
  const line = (key: string) => example.lines.find((l) => l.key === key)?.eur ?? 0
  const priced = index.priceBands.pricedAsTotal || 1
  const share = (n: number) => f.pct(Math.round((n / priced) * 1000) / 10)

  return {
    asOf: f.date(index.asOf),
    asOfMonth: f.monthYear(index.asOf),
    city: statFields(index.city, f),
    beds,
    districts,
    nearSea: statFields(index.nearSea300m, f),
    newBuild: statFields(index.newBuild, f),
    bands: {
      under60k: f.num(index.priceBands.under60k),
      from60to100k: f.num(index.priceBands.from60to100k),
      from100to150k: f.num(index.priceBands.from100to150k),
      from150k: f.num(index.priceBands.from150k),
      priced: f.num(index.priceBands.pricedAsTotal),
      under60kPct: share(index.priceBands.under60k),
      from60to100kPct: share(index.priceBands.from60to100k),
      from100to150kPct: share(index.priceBands.from100to150k),
      from150kPct: share(index.priceBands.from150k),
    },
    rates: {
      notaryMin: f.pct2(PURCHASE_COST_RATES.notaryPctMin),
      notaryMax: f.pct2(PURCHASE_COST_RATES.notaryPctMax),
      registrationAll: f.num(PURCHASE_COST_RATES.registrationAll),
      registrationEur: f.num(PURCHASE_COST_RATES.registrationEur),
      agencyPct: f.pct(PURCHASE_COST_RATES.agencyBuyerPct),
    },
    example: {
      price: f.num(median),
      notary: f.num(line('notary')),
      registration: f.num(line('registration')),
      agency: f.num(line('agency')),
      total: f.num(example.totalEur),
      pct: f.pct(Math.round(example.pct * 10) / 10),
    },
  }
}

export function buildGuidePdf(locale: GuideLocale, markdown: string, index: PriceIndex, ttf: Uint8Array): { bytes: Uint8Array; pages: number } {
  const chrome = CHROME[locale]
  const blocks = parseMarkdown(substitute(markdown, placeholderData(index, locale)))
  const render = (total: number | null) => {
    const doc = new PdfDocument({
      title: chrome.title,
      author: 'Domlivo',
      subject: chrome.subject,
      keywords: chrome.keywords,
      lang: locale,
      creationDate: new Date(`${index.asOf}T00:00:00Z`),
    })
    const font = doc.addFont(ttf)
    const pages = layoutGuide(
      doc,
      { ...DEFAULT_THEME, font },
      { blocks, brand: 'Domlivo', footer: chrome.footer, pageLabel: chrome.pageLabel },
      total,
    )
    return { doc, pages }
  }
  const first = render(null)
  const second = render(first.pages)
  return { bytes: second.doc.finish(), pages: second.pages }
}

function main() {
  const only = arg('--locale') as GuideLocale | undefined
  const indexPath = resolve(root, arg('--price-index') ?? resolve(dataDir, 'price-index.json'))
  const index = JSON.parse(readFileSync(indexPath, 'utf8')) as PriceIndex
  if (index.asOf !== GUIDE_PRICE_INDEX_AS_OF) {
    throw new Error(
      `Price index is dated ${index.asOf} but GUIDE_PRICE_INDEX_AS_OF is ${GUIDE_PRICE_INDEX_AS_OF}; update src/lib/guides/durresGuide.ts so the card quotes the same date`,
    )
  }
  const ttf = new Uint8Array(readFileSync(resolve(dataDir, 'fonts/Inter-Regular.ttf')))
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  const locales = only ? [only] : GUIDE_LOCALES
  for (const locale of locales) {
    if (!GUIDE_LOCALES.includes(locale)) throw new Error(`Unknown locale ${locale}`)
    const md = readFileSync(resolve(dataDir, `${locale}.md`), 'utf8')
    const { bytes, pages } = buildGuidePdf(locale, md, index, ttf)
    const out = resolve(outDir, guidePdfFileName(locale))
    writeFileSync(out, bytes)
    console.log(`${locale}: ${pages} pages, ${(bytes.length / 1024).toFixed(0)} KB → ${out.replace(root, '.')}`)
  }
}

main()
