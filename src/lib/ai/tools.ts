/**
 * Tools the assistant can call.
 *
 * Phase 1 has exactly one. The model already holds the whole catalog (see
 * `catalogSnapshot.ts`), so matching happens in the model and the tool's job is
 * the two things a model must never do itself: prove the listings exist, and
 * produce the payload the UI renders. Every slug is re-checked against the
 * published catalog, so a hallucinated or newly-unpublished slug is dropped
 * rather than shown.
 */

import type Anthropic from '@anthropic-ai/sdk'
import { getClient } from '@/lib/sanity/queries/_core'
import { PUBLISHED_PROPERTY_FILTER } from '@/lib/sanity/groq/propertyFilters'
import { PUBLIC_DEAL_TYPES } from '@/lib/catalog/publicDealTypes'
import { fetchCityCountrySlugByCitySlug } from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'
import { buildListingUrl } from '@/lib/routes/listingRoutes'
import type { CatalogProperty } from '@/types/catalog'
import type { PropertyHomes } from '@/types/propertyHomes'
import { calculateRoi } from '@/lib/calculators/roi'
import { calculateMortgage } from '@/lib/calculators/mortgage'
import { AI_MAX_CARDS } from './limits'

export const SHOW_PROPERTIES_TOOL: Anthropic.Tool = {
  name: 'show_properties',
  description:
    'Display listings to the visitor as picture cards. Pass the slugs you picked from the catalog ' +
    'in the system prompt, best match first. Call this every time you name specific properties — ' +
    'the visitor sees cards, not your text, so never describe a listing without calling it. ' +
    'Optionally pass catalogLink to render a "see all" button pointing at the ordinary catalog ' +
    'page with those filters applied.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['slugs'],
    properties: {
      slugs: {
        type: 'array',
        description: `Property slugs, exactly as written in the catalog. Best match first, at most ${AI_MAX_CARDS}.`,
        items: { type: 'string' },
        minItems: 1,
        maxItems: AI_MAX_CARDS,
      },
      catalogLink: {
        type: 'object',
        description: 'Filters describing the broader search, for the "see all" link. Omit when the cards are the whole answer.',
        additionalProperties: false,
        properties: {
          city: { type: 'string', description: 'City slug' },
          district: { type: 'string', description: 'District slug' },
          type: { type: 'string', description: 'Property type slug' },
          minPrice: { type: 'number', description: 'EUR' },
          maxPrice: { type: 'number', description: 'EUR' },
          beds: { type: 'integer' },
        },
      },
    },
  },
}

export const AI_TOOLS: Anthropic.Tool[] = [SHOW_PROPERTIES_TOOL]

type CatalogLinkInput = {
  city?: string
  district?: string
  type?: string
  minPrice?: number
  maxPrice?: number
  beds?: number
}

type ShowPropertiesInput = {
  slugs?: unknown
  catalogLink?: CatalogLinkInput
}

/** What goes back to the model: proof of what exists, nothing the UI needs. */
export type ShowPropertiesModelResult = {
  shown: string[]
  /** Slugs the model asked for that are not in the published catalog. */
  notFound: string[]
  catalogUrl?: string
}

/** What goes to the browser: everything the card component needs. */
export type ShowPropertiesUiResult = {
  items: PropertyHomes[]
  catalogUrl?: string
}

const CARD_PROJECTION = `{
  _id,
  _type,
  title,
  "slug": slug.current,
  description,
  price,
  currency,
  area,
  bedrooms,
  bathrooms,
  yearBuilt,
  status,
  promoted,
  promotionType,
  featuredOrder,
  discountPercent,
  investment,
  coordinatesLat,
  coordinatesLng,
  "city": city-> { _id, title, "slug": slug.current },
  "district": district-> { _id, title, "slug": slug.current, "citySlug": city->slug.current },
  "type": type-> { _id, title, "slug": slug.current },
  "mainImageUrl": gallery[0].asset->url,
  "galleryUrls": gallery[].asset->url
}`

/**
 * Listings by slug, through the same publish/lifecycle/deal gate as the
 * catalog. Deliberately not `fetchPropertiesBySlugs` — that helper has no
 * published filter, and this path is reachable by anything the model says.
 */
async function fetchPublishedBySlugs(slugs: string[]): Promise<CatalogProperty[]> {
  const client = getClient()
  if (!client || slugs.length === 0) return []
  const query = `*[_type == "property" && slug.current in $slugs && ${PUBLISHED_PROPERTY_FILTER} && status in $publicDealTypes] ${CARD_PROJECTION}`
  try {
    const rows = await client.fetch<CatalogProperty[]>(query, {
      slugs,
      publicDealTypes: [...PUBLIC_DEAL_TYPES],
    })
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.warn('[ai] fetchPublishedBySlugs failed:', err)
    return []
  }
}

function sanitizeSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const slug = entry.trim().toLowerCase()
    if (!slug || !/^[a-z0-9-]+$/.test(slug) || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
    if (out.length >= AI_MAX_CARDS) break
  }
  return out
}

function positiveInt(value: unknown): number | undefined {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n)
}

/**
 * The "see all" destination: an ordinary catalog URL built by the same helper
 * the filter form uses, so the assistant always hands the visitor back to a
 * real, shareable, indexable page.
 */
async function buildCatalogUrl(locale: string, link: CatalogLinkInput | undefined): Promise<string | undefined> {
  if (!link) return undefined
  const city = typeof link.city === 'string' ? link.city.trim().toLowerCase() : ''
  const district = typeof link.district === 'string' ? link.district.trim().toLowerCase() : ''
  const type = typeof link.type === 'string' ? link.type.trim().toLowerCase() : ''
  const minPrice = positiveInt(link.minPrice)
  const maxPrice = positiveInt(link.maxPrice)
  const beds = positiveInt(link.beds)

  if (!city && !district && !type && !minPrice && !maxPrice && !beds) return undefined

  const query = new URLSearchParams()
  if (minPrice) query.set('minPrice', String(minPrice))
  if (maxPrice) query.set('maxPrice', String(maxPrice))
  if (beds) query.set('beds', String(beds))

  const trustedCityCountrySlug = city ? (await fetchCityCountrySlugByCitySlug(city)) ?? undefined : undefined

  return buildListingUrl({
    scope: 'catalog',
    locale,
    city: city || undefined,
    trustedCityCountrySlug,
    district: district || undefined,
    propertyType: type || undefined,
    query,
  })
}

export async function runShowProperties(
  rawInput: unknown,
  locale: string,
): Promise<{ model: ShowPropertiesModelResult; ui: ShowPropertiesUiResult }> {
  const input = (rawInput ?? {}) as ShowPropertiesInput
  const requested = sanitizeSlugs(input.slugs)
  const rows = await fetchPublishedBySlugs(requested)

  // Keep the model's ordering — it ranked them, the catalog did not.
  const bySlug = new Map(rows.map((row) => [row.slug, row]))
  const ordered = requested
    .map((slug) => bySlug.get(slug))
    .filter((row): row is CatalogProperty => Boolean(row))

  const items = ordered.map((row) => mapCatalogPropertyToCard(row, locale))
  const shown = ordered.map((row) => row.slug ?? '').filter(Boolean)
  const notFound = requested.filter((slug) => !bySlug.has(slug))
  const catalogUrl = await buildCatalogUrl(locale, input.catalogLink)

  return {
    model: { shown, notFound, catalogUrl },
    ui: { items, catalogUrl },
  }
}

export const __testables = { sanitizeSlugs, buildCatalogUrl }

/* ------------------------------------------------------------------ *
 * Calculators
 *
 * The zone data needed to model a return does not exist yet — yields are
 * empty across every metrics record — so these deliberately take the numbers
 * from the visitor instead: "if you rented it for 600 a month, here is the
 * gross yield". That is an honest calculation on a stated assumption rather
 * than a market claim, and it is useful today. The arithmetic runs in the
 * project's tested calculators; the model never does it itself.
 * ------------------------------------------------------------------ */

export const CALC_ROI_TOOL: Anthropic.Tool = {
  name: 'calc_roi',
  description:
    'Gross and net rental yield for a stated rent. The visitor must supply the rent — never invent ' +
    'one, and never present the result as what the property will actually earn. State the ' +
    'assumptions back to them alongside the number.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['priceEur', 'rentalType'],
    properties: {
      priceEur: { type: 'number', description: 'Purchase price in EUR' },
      rentalType: { type: 'string', enum: ['ltr', 'str'], description: 'Long-term or short-term' },
      monthlyRentEur: { type: 'number', description: 'Long-term only: monthly rent the visitor expects' },
      adrEur: { type: 'number', description: 'Short-term only: average nightly rate' },
      occupancyPct: { type: 'number', description: 'Short-term only: occupancy 0-100' },
      mgmtFeePct: { type: 'number', description: 'Management fee, % of gross. Default 0' },
      taxRatePct: { type: 'number', description: 'Rental income tax, %. Albania is 15 from 2026' },
    },
  },
}

export const CALC_MORTGAGE_TOOL: Anthropic.Tool = {
  name: 'calc_mortgage',
  description:
    'Monthly payment on an annuity mortgage. All terms come from the visitor; do not assume a rate ' +
    'they have not mentioned. Not a lending offer, and not advice about whether to borrow.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['priceEur', 'downPaymentPct', 'annualRatePct', 'termYears'],
    properties: {
      priceEur: { type: 'number' },
      downPaymentPct: { type: 'number', description: '0-100' },
      annualRatePct: { type: 'number' },
      termYears: { type: 'number' },
    },
  },
}

/** Bank of Albania caps LTV at 85% for a first home and lower elsewhere; 80 is the safe middle. */
const DEFAULT_MAX_LTV_PCT = 80

export function runCalcRoi(rawInput: unknown): unknown {
  const input = (rawInput ?? {}) as Record<string, unknown>
  const rentalType = input.rentalType === 'str' ? 'str' : 'ltr'
  const result = calculateRoi({
    priceEur: Number(input.priceEur),
    rentalType,
    monthlyRentEur: Number(input.monthlyRentEur) || undefined,
    adrEur: Number(input.adrEur) || undefined,
    occupancyPct: Number(input.occupancyPct) || undefined,
    mgmtFeePct: Number(input.mgmtFeePct) || 0,
    taxRatePct: Number(input.taxRatePct) || 15,
  })
  if (!result) {
    return { error: 'Not enough input. Ask the visitor for the rent (or nightly rate and occupancy).' }
  }
  return {
    ...result,
    note: 'Gross yield ignores vacancy, repairs and purchase costs. Net applies only the management fee and tax given.',
  }
}

export function runCalcMortgage(rawInput: unknown): unknown {
  const input = (rawInput ?? {}) as Record<string, unknown>
  const result = calculateMortgage({
    priceEur: Number(input.priceEur),
    downPaymentPct: Number(input.downPaymentPct),
    annualRatePct: Number(input.annualRatePct),
    termYears: Number(input.termYears),
    maxLtvPct: DEFAULT_MAX_LTV_PCT,
  })
  if (!result) return { error: 'Not enough input. Ask for price, down payment, rate and term.' }
  return result
}

/** Tools for the property conversation: the catalog tool plus the calculators. */
export const AI_PROPERTY_TOOLS: Anthropic.Tool[] = [
  SHOW_PROPERTIES_TOOL,
  CALC_ROI_TOOL,
  CALC_MORTGAGE_TOOL,
]
