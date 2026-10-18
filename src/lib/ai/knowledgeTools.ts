/**
 * Tools that put the research knowledge base under the assistant's hands.
 *
 * The prompt already carries every current fact as one line each, so the model
 * can answer most questions without a round trip. These exist for the three
 * things a prompt block cannot do:
 *
 *  - `lookup_facts` — pull the full text, methodology and source of a fact when
 *    the one-line summary is not enough, or search the long tail by metadata.
 *  - `calc_utilities` — run the running-cost model on the visitor's own flat.
 *    Arithmetic belongs in tested code, not in a language model, and this one
 *    has a cliff in it (700 kWh) that is easy to get wrong by hand.
 *  - `cite` — prove the data ids the model wants to quote exist, and turn them
 *    into links the visitor can open. A hallucinated id is dropped here rather
 *    than rendered as a source.
 */

import type Anthropic from '@anthropic-ai/sdk'
import {
  fetchFactsByDataIds,
  searchKnowledgeFacts,
  type KnowledgeFact,
} from '@/lib/sanity/queries/knowledge'
import {
  annualUtilitiesEur,
  calculateUtilities,
  UTILITY_CITIES,
  type Season,
  type UtilityCity,
} from '@/lib/calculators/utilities'

/** Cap on facts returned to the model in one call. */
const MAX_FACTS = 12

export const LOOKUP_FACTS_TOOL: Anthropic.Tool = {
  name: 'lookup_facts',
  description:
    'Look up sourced figures in the DomLivo research database: tariffs, prices per m², rents, ' +
    'occupancy, taxes, costs. Use it when the KNOWLEDGE block does not carry enough detail — the ' +
    'exact wording of a rule, the methodology behind an estimate, the source of a number — or when ' +
    'the visitor asks about something you cannot find in it. Returns the full value text, ' +
    'confidence and source for each fact. Pass dataIds when you already know them.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      dataIds: {
        type: 'array',
        description: 'Exact fact ids from the KNOWLEDGE block, e.g. DATA-ELEC-0001.',
        items: { type: 'string' },
        maxItems: MAX_FACTS,
      },
      query: {
        type: 'string',
        description: 'Free text, English or Albanian: "water tariff", "qira 1+1", "occupancy August".',
      },
      category: {
        type: 'string',
        description:
          'Narrow by topic: electricity, water, internet, heating, air_conditioning, property_prices, ' +
          'long_term_rental, short_term_rental, taxes, purchase_costs, renovation, furniture, ' +
          'building_fees, property_management, macro, tourism, forecast.',
      },
      city: {
        type: 'string',
        description:
          'City slug as used by the catalog: durres, vlore, sarande, himare, tirana, shengjin. ' +
          'National facts are always included alongside the city ones.',
      },
      season: {
        type: 'string',
        enum: ['winter', 'summer', 'shoulder', 'annual'],
      },
      limit: { type: 'integer', minimum: 1, maximum: MAX_FACTS },
    },
  },
}

export const CALC_UTILITIES_TOOL: Anthropic.Tool = {
  name: 'calc_utilities',
  description:
    'Monthly running cost of an apartment — electricity (including the 700 kWh cliff), water and ' +
    'sewerage on the city tariff, waste tax, internet, building fee, insurance, AC servicing. ' +
    'Call it whenever the visitor asks what utilities cost, instead of adding figures up yourself. ' +
    'Ask for the city, size and season if they have not said; assume two occupants unless told.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['city', 'sizeM2', 'season'],
    properties: {
      city: { type: 'string', enum: [...UTILITY_CITIES] },
      sizeM2: { type: 'number', description: 'Gross floor area in m²' },
      occupants: { type: 'integer', minimum: 1, maximum: 4, description: 'Default 2' },
      season: {
        type: 'string',
        enum: ['winter', 'summer', 'shoulder'],
        description: 'winter = heating with AC, summer = cooling, shoulder = neither',
      },
      acHoursPerDay: { type: 'number', description: 'Hours the AC runs per day in season. Default 8' },
      acBtu: { type: 'integer', enum: [9000, 12000, 18000, 24000], description: 'Default 12000' },
      acUnits: { type: 'integer', minimum: 0, maximum: 4, description: 'Default 1 up to 70 m², else 2' },
      hasBoiler: { type: 'boolean', description: 'Electric storage water heater. Default true' },
      includeAnnual: { type: 'boolean', description: 'Also return the yearly total for this city' },
    },
  },
}

export const CITE_TOOL: Anthropic.Tool = {
  name: 'cite',
  description:
    'Register the sources behind the figures in your answer. Call it once, last, with every data id ' +
    'you used. The visitor sees them as source chips under your reply, so you never have to write ' +
    'ids into your text. Ids that do not exist are dropped — if all of them are dropped, say where ' +
    'the figure came from in words instead.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['dataIds'],
    properties: {
      dataIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 12,
        description: 'Fact ids used in this answer, most important first.',
      },
    },
  },
}

export const KNOWLEDGE_TOOLS: Anthropic.Tool[] = [
  LOOKUP_FACTS_TOOL,
  CALC_UTILITIES_TOOL,
  CITE_TOOL,
]

/* ------------------------------------------------------------------ run --- */

function sanitizeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim().toUpperCase())
    .filter((id) => /^DATA-[A-Z0-9-]{2,60}$/.test(id))
    .slice(0, MAX_FACTS)
}

/** What the model gets back: enough to quote precisely, nothing it cannot use. */
function factForModel(fact: KnowledgeFact) {
  return {
    dataId: fact.dataId,
    category: fact.category,
    where: fact.citySlug || fact.geography || 'Albania',
    value: fact.valueText || fact.title,
    unit: fact.unit,
    numeric: fact.value ?? null,
    range:
      typeof fact.valueLow === 'number' && typeof fact.valueHigh === 'number'
        ? [fact.valueLow, fact.valueHigh]
        : null,
    period: fact.period,
    season: fact.season,
    confidence: fact.confidence,
    dataKind: fact.dataKind,
    methodology: fact.methodology ?? undefined,
    source: fact.source ? `${fact.source.name}${fact.source.publishedAt ? `, ${fact.source.publishedAt}` : ''}` : undefined,
    lastVerified: fact.lastVerifiedAt,
  }
}

export async function runLookupFacts(rawInput: unknown): Promise<unknown> {
  const input = (rawInput ?? {}) as Record<string, unknown>
  const ids = sanitizeIds(input.dataIds)

  const facts = ids.length > 0
    ? await fetchFactsByDataIds(ids)
    : await searchKnowledgeFacts({
        query: typeof input.query === 'string' ? input.query.slice(0, 120) : undefined,
        category: typeof input.category === 'string' ? input.category.slice(0, 40) : undefined,
        citySlug: typeof input.city === 'string' ? input.city.slice(0, 40) : undefined,
        season:
          typeof input.season === 'string' && input.season !== 'annual'
            ? input.season.slice(0, 20)
            : undefined,
        limit: typeof input.limit === 'number' ? input.limit : MAX_FACTS,
      })

  if (facts.length === 0) {
    return {
      facts: [],
      note: 'Nothing matched. Say plainly that the database has no figure for this and offer an agent.',
    }
  }

  const found = new Set(facts.map((f) => f.dataId))
  return {
    facts: facts.map(factForModel),
    notFound: ids.filter((id) => !found.has(id)),
  }
}

export function runCalcUtilities(rawInput: unknown): unknown {
  const input = (rawInput ?? {}) as Record<string, unknown>
  const city = (typeof input.city === 'string' ? input.city : '') as UtilityCity
  if (!UTILITY_CITIES.includes(city)) {
    return { error: `Unknown city. The model covers: ${UTILITY_CITIES.join(', ')}.` }
  }
  const season = (typeof input.season === 'string' ? input.season : 'shoulder') as Season
  const sizeM2 = Number(input.sizeM2)
  if (!Number.isFinite(sizeM2) || sizeM2 <= 0) {
    return { error: 'Ask the visitor for the floor area in m².' }
  }

  const result = calculateUtilities({
    city,
    sizeM2,
    occupants: Number(input.occupants) || 2,
    season: season === 'winter' || season === 'summer' ? season : 'shoulder',
    acHoursPerDay: Number(input.acHoursPerDay) || undefined,
    acBtu: (Number(input.acBtu) || undefined) as 9000 | 12000 | 18000 | 24000 | undefined,
    acUnits: typeof input.acUnits === 'number' ? input.acUnits : undefined,
    hasBoiler: input.hasBoiler !== false,
  })

  const annual =
    input.includeAnnual === true
      ? annualUtilitiesEur({
          city,
          sizeM2,
          occupants: Number(input.occupants) || 2,
          acHoursPerDay: Number(input.acHoursPerDay) || undefined,
          acBtu: (Number(input.acBtu) || undefined) as 9000 | 12000 | 18000 | 24000 | undefined,
          acUnits: typeof input.acUnits === 'number' ? input.acUnits : undefined,
          hasBoiler: input.hasBoiler !== false,
        })
      : undefined

  return {
    city: result.city,
    season: result.season,
    sizeM2: result.sizeM2,
    occupants: result.occupants,
    kwhPerMonth: result.kwhPerMonth,
    aboveElectricityThreshold: result.aboveElectricityThreshold,
    lines: result.lines,
    totalEurPerMonth: result.totalEurPerMonth,
    annualEur: annual,
    assumptions: result.assumptions,
    dataIds: Array.from(new Set(result.lines.flatMap((line) => line.dataIds))),
    note: 'ESTIMATE from the research model. Say so, and give the assumptions with the number.',
  }
}

/** A source chip in the UI. */
export type AiCitation = {
  dataId: string
  label: string
  value: string
  confidence: string
  period: string
  lastVerifiedAt?: string
  sourceName?: string
  sourceUrl?: string
  /** Present only when the knowledge page is published. */
  articlePath?: string
}

export type CiteResult = {
  model: { cited: string[]; dropped: string[] }
  ui: AiCitation[]
}

function shortValue(fact: KnowledgeFact): string {
  const unit = fact.unit && fact.unit !== 'text' ? ` ${fact.unit}` : ''
  if (typeof fact.valueLow === 'number' && typeof fact.valueHigh === 'number') {
    return `${fact.valueLow}–${fact.valueHigh}${unit}`
  }
  if (typeof fact.value === 'number') return `${fact.value}${unit}`
  return (fact.valueText || '').replace(/\s+/g, ' ').slice(0, 90)
}

export async function runCite(rawInput: unknown, locale: string): Promise<CiteResult> {
  const input = (rawInput ?? {}) as Record<string, unknown>
  const ids = sanitizeIds(input.dataIds)
  if (ids.length === 0) return { model: { cited: [], dropped: [] }, ui: [] }

  const facts = await fetchFactsByDataIds(ids)
  const byId = new Map(facts.map((f) => [f.dataId, f]))

  const ui: AiCitation[] = []
  for (const id of ids) {
    const fact = byId.get(id)
    if (!fact) continue
    ui.push({
      dataId: fact.dataId,
      label: fact.title || fact.metric.replace(/_/g, ' '),
      value: shortValue(fact),
      confidence: fact.confidence,
      period: fact.period,
      lastVerifiedAt: fact.lastVerifiedAt,
      sourceName: fact.source?.name,
      sourceUrl: fact.source?.url || fact.source?.archivedUrl,
      articlePath: fact.articleSlug
        ? `/${locale}/knowledge/${fact.articleSlug}#${fact.dataId}`
        : undefined,
    })
  }

  return {
    model: {
      cited: ui.map((c) => c.dataId),
      dropped: ids.filter((id) => !byId.has(id)),
    },
    ui,
  }
}

export const __testables = { sanitizeIds, shortValue, factForModel }
