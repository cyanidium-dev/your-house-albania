/**
 * The catalog search the assistant calls instead of holding every listing in
 * its prompt (see `catalogSnapshot.ts`). Hard filters run here, on the
 * structured fields; the model then reads the returned lines for the soft part
 * of the request ("quiet", "good for renting out") and picks what to show.
 */
import type Anthropic from '@anthropic-ai/sdk'
import type { CatalogItem, CatalogSnapshot } from './catalogSnapshot'

/** Lines returned per call: enough to choose four from, small enough to stay cheap. */
export const SEARCH_DEFAULT_LIMIT = 15
export const SEARCH_MAX_LIMIT = 30

export const SEARCH_PROPERTIES_TOOL: Anthropic.Tool = {
  name: 'search_properties',
  description:
    'Search the DomLivo catalog of properties for sale. The catalog is not in your prompt: call this ' +
    'before you name, compare or show any listing, and before saying a city or type has nothing. ' +
    'Pass EVERY limit the visitor stated - city, district, rooms, budget, sea distance, new build - and ' +
    'nothing they did not state. Rooms: studio, garsoniere, студия = 0 bedrooms; 1+1, однушка, ' +
    'one-bedroom, monolocale con camera = exactly 1 (minBedrooms 1, maxBedrooms 1); 2+1, двушка = 2; ' +
    '3+1 = 3. A city named in any language or case (Дуррес, Durazzo, Durrësi) is its slug. Returns the number of matches and ' +
    'one line per listing (slug | district/city | type | deal | price | area | bedrooms/bathrooms | ' +
    'year | price per m² | sea distance | stage | amenities | description). Read the lines for the ' +
    'soft criteria, then call show_properties with the slugs you chose. If nothing matches, call it ' +
    'again with one limit relaxed and say which one.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      city: { type: 'string', description: 'City slug from "Cities with stock".' },
      district: { type: 'string', description: 'District slug from "Districts".' },
      type: { type: 'string', description: 'Property type slug from "Property types".' },
      minPrice: { type: 'number', description: 'EUR, total price.' },
      maxPrice: { type: 'number', description: 'EUR, total price. Off-plan units are compared by rate × area.' },
      minBedrooms: { type: 'integer', description: 'A 1+1 has 1 bedroom, a 2+1 has 2, a studio 0.' },
      maxBedrooms: { type: 'integer' },
      minArea: { type: 'number', description: 'm²' },
      maxArea: { type: 'number', description: 'm²' },
      maxSeaMeters: { type: 'number', description: 'Walking distance to the sea; 150 for "first line", 500 for "near the sea".' },
      newBuild: { type: 'boolean', description: 'true: off-plan or under construction only; false: finished only.' },
      amenities: { type: 'array', items: { type: 'string' }, description: 'Amenity slugs from the vocabulary; all must be present.' },
      keywords: { type: 'string', description: 'Words that must all appear in the title, description or amenities (English), e.g. "sea view", "garden". Not for city, rooms, price or sea distance: use the filters.' },
      sort: { type: 'string', enum: ['price_asc', 'price_desc', 'sea_asc', 'price_per_m2_asc'] },
      limit: { type: 'integer', minimum: 1, maximum: SEARCH_MAX_LIMIT },
    },
  },
}

type SearchInput = {
  city?: string
  district?: string
  type?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  maxBedrooms?: number
  minArea?: number
  maxArea?: number
  maxSeaMeters?: number
  newBuild?: boolean
  amenities?: string[]
  keywords?: string
  sort?: 'price_asc' | 'price_desc' | 'sea_asc' | 'price_per_m2_asc'
  limit?: number
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
/** Lower case without diacritics: the model writes "Durrës" or "durrës", the slug is "durres". */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? fold(v.trim()) : undefined)
/** A place the model names by label ("Plazh", "Shëngjin") or slug ("plazh-durres"). */
const placeMatches = (want: string, slug: string) => slug === want || slug === want.replace(/\s+/g, '-') || slug.startsWith(`${want.replace(/\s+/g, '-')}-`)

function parseInput(raw: unknown): SearchInput {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const sort = str(o.sort)
  return {
    city: str(o.city),
    district: str(o.district),
    type: str(o.type),
    minPrice: num(o.minPrice),
    maxPrice: num(o.maxPrice),
    minBedrooms: num(o.minBedrooms),
    maxBedrooms: num(o.maxBedrooms),
    minArea: num(o.minArea),
    maxArea: num(o.maxArea),
    maxSeaMeters: num(o.maxSeaMeters),
    newBuild: typeof o.newBuild === 'boolean' ? o.newBuild : undefined,
    amenities: Array.isArray(o.amenities) ? o.amenities.map(str).filter((a): a is string => Boolean(a)) : undefined,
    keywords: str(o.keywords),
    sort: sort === 'price_asc' || sort === 'price_desc' || sort === 'sea_asc' || sort === 'price_per_m2_asc' ? sort : undefined,
    limit: num(o.limit),
  }
}

function matches(item: CatalogItem, q: SearchInput): boolean {
  if (q.city && !placeMatches(q.city, item.city)) return false
  if (q.district && !placeMatches(q.district, item.district)) return false
  if (q.type && item.type !== q.type) return false
  if (q.minPrice !== undefined && !(item.price > 0 && item.price >= q.minPrice)) return false
  if (q.maxPrice !== undefined && !(item.price > 0 && item.price <= q.maxPrice)) return false
  if (q.minBedrooms !== undefined && item.bedrooms < q.minBedrooms) return false
  if (q.maxBedrooms !== undefined && item.bedrooms > q.maxBedrooms) return false
  if (q.minArea !== undefined && !(item.area > 0 && item.area >= q.minArea)) return false
  if (q.maxArea !== undefined && !(item.area > 0 && item.area <= q.maxArea)) return false
  if (q.maxSeaMeters !== undefined && !(item.sea !== null && item.sea <= q.maxSeaMeters)) return false
  if (q.newBuild !== undefined && item.newBuild !== q.newBuild) return false
  if (q.amenities?.length && !q.amenities.every((a) => item.amenities.includes(a))) return false
  if (q.keywords) {
    const words = q.keywords.split(/\s+/).filter((w) => w.length > 2)
    if (words.length && !words.every((w) => item.text.includes(w))) return false
  }
  return true
}

const perM2 = (i: CatalogItem) => (i.price > 0 && i.area > 0 ? i.price / i.area : Number.POSITIVE_INFINITY)

/** The tool's answer, as text the model reads. */
export function runSearchProperties(rawInput: unknown, snapshot: CatalogSnapshot): string {
  const q = parseInput(rawInput)
  const limit = Math.min(Math.max(Math.round(q.limit ?? SEARCH_DEFAULT_LIMIT), 1), SEARCH_MAX_LIMIT)
  const found = snapshot.items.filter((item) => matches(item, q))
  const sorted = [...found]
  if (q.sort === 'price_desc') sorted.sort((a, b) => b.price - a.price)
  else if (q.sort === 'sea_asc') sorted.sort((a, b) => (a.sea ?? Infinity) - (b.sea ?? Infinity))
  else if (q.sort === 'price_per_m2_asc') sorted.sort((a, b) => perM2(a) - perM2(b))
  else sorted.sort((a, b) => (a.price || Infinity) - (b.price || Infinity))
  if (found.length === 0) {
    return 'No listing matches these limits. Relax one limit and search again, or tell the visitor plainly that there is nothing and name the nearest real alternative.'
  }
  const shown = sorted.slice(0, limit)
  const head = `${found.length} listing${found.length === 1 ? '' : 's'} match${found.length === 1 ? 'es' : ''}; showing ${shown.length}${found.length > shown.length ? ' (narrow the search or change the sort to see others)' : ''}:`
  return [head, ...shown.map((i) => i.line)].join('\n')
}

export const __testables = { parseInput, matches }
