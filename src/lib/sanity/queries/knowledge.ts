/**
 * Reads for the knowledge base: the sourced facts behind every figure the
 * assistant and the `/knowledge` pages quote.
 *
 * Three shapes, three readers:
 *  - `fetchKnowledgeFactRows` — everything current, compressed for the model's
 *    prompt (see `lib/ai/knowledgeSnapshot.ts`).
 *  - `fetchFactsByDataIds` / `searchKnowledgeFacts` — the assistant's tools.
 *  - `fetchKnowledgeArticle*` — the published pages.
 *
 * A fact stays usable before its article is published: the article is the
 * pretty rendering, the fact plus its source is the citation. Only the link
 * waits for publication.
 */

import { createClient } from '@sanity/client'
import { getClient, sanityCache, SANITY_TAGS } from './_core'
import { resolveLocalizedString } from '@/lib/sanity/localized'

/**
 * Knowledge documents are read with a server-side token.
 *
 * The dataset's public grant covers the catalog types, not these, and that is
 * the right way round: an article stays invisible until an editor publishes it,
 * and the 369 facts behind it are not queryable by anyone who knows the project
 * id. Everything here runs on the server — pages, the assistant route, the
 * public facts endpoint — so a token is available and never reaches a browser.
 *
 * Without one the reads come back empty and every surface degrades to "no
 * figure for that", which is the correct failure: silence rather than a number
 * nobody can check.
 */
let cachedServerClient: ReturnType<typeof createClient> | null | undefined

function getKnowledgeClient() {
  if (cachedServerClient !== undefined) return cachedServerClient
  const projectId =
    process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
  const dataset =
    process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  const token = process.env.SANITY_API_TOKEN ?? process.env.SANITY_WRITE_TOKEN
  cachedServerClient =
    projectId && token
      ? createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false })
      : // Falls back to the public client so a project that *has* widened its
        // grant keeps working without a token.
        getClient()
  return cachedServerClient
}

/* ------------------------------------------------------------------ types -- */

export type KnowledgeSource = {
  sourceId: string
  name: string
  url?: string
  archivedUrl?: string
  sourceType?: string
  priorityRank?: number
  publishedAt?: string
  accessedAt?: string
}

export type KnowledgeFact = {
  dataId: string
  factFamily?: string
  category: string
  metric: string
  title?: string
  dataKind?: string
  value?: number
  valueLow?: number
  valueHigh?: number
  unit: string
  valueText?: string
  originalValue?: number
  originalCurrency?: string
  geography?: string
  citySlug?: string
  propertyType?: string
  season?: string
  period: string
  confidence: string
  methodology?: string
  rawQuote?: string
  lastVerifiedAt?: string
  source?: KnowledgeSource
  /** Where to link a citation, when the page is live. */
  articleSlug?: string
  articleTitle?: string
  sectionKey?: string
  tableId?: string
  rowId?: string
}

export type KnowledgeArticleSummary = {
  documentId: string
  slug: string
  title: string
  summary?: string
  category: string
  citySlug?: string
  dataPeriod?: string
  confidence?: string
  lastUpdated?: string
  questionCount: number
}

export type KnowledgeTableRow = {
  rowId: string
  cells: string[]
  facts: KnowledgeFact[]
}

export type KnowledgeTable = {
  tableId: string
  title?: string
  columns: string[]
  rows: KnowledgeTableRow[]
  methodology?: string
  confidence?: string
}

export type KnowledgeSection = {
  sectionKey: string
  heading: string
  body?: unknown[]
  tables: KnowledgeTable[]
}

export type KnowledgeArticle = KnowledgeArticleSummary & {
  questions: string[]
  sections: KnowledgeSection[]
  exchangeRateNote?: string
  nextReviewAt?: string
  gaps: { gapId?: string; description?: string; priority?: string }[]
  sourceFile?: string
  relatedArticles: { slug: string; title: string }[]
}

/* ----------------------------------------------------------------- groq --- */

/** Only current facts are quotable; superseded ones stay for history pages. */
const CURRENT_FACT = `_type == "knowledgeFact" && isCurrent == true`

const SOURCE_PROJECTION = `{
  sourceId, name, url, archivedUrl, sourceType, priorityRank, publishedAt, accessedAt
}`

const FACT_PROJECTION = `{
  dataId, factFamily, category, metric, title, dataKind,
  value, valueLow, valueHigh, unit, valueText,
  originalValue, originalCurrency,
  geography, "citySlug": city->slug.current,
  propertyType, season, period, confidence, methodology, rawQuote, lastVerifiedAt,
  "source": source->${SOURCE_PROJECTION},
  "articleSlug": select(article->isPublished == true => article->slug.current, null),
  "articleTitle": article->title.en,
  sectionKey, tableId, rowId
}`

/* --------------------------------------------------------------- fetchers -- */

async function fetchAllCurrentFacts(): Promise<KnowledgeFact[]> {
  const client = getKnowledgeClient()
  if (!client) return []
  try {
    const rows = await client.fetch<KnowledgeFact[]>(
      `*[${CURRENT_FACT}] | order(category asc, dataId asc) ${FACT_PROJECTION}`,
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.warn('[knowledge] fact fetch failed:', err)
    return []
  }
}

/** Every current fact. Cached: this is the assistant's prompt payload. */
export const fetchKnowledgeFactRows = sanityCache(fetchAllCurrentFacts, ['knowledge-facts'], {
  revalidate: 3600,
  tags: [SANITY_TAGS.knowledgeFact, SANITY_TAGS.knowledgeSource, SANITY_TAGS.knowledgeArticle],
})

/** Exact lookup — what `cite` uses to prove a data id the model produced exists. */
export async function fetchFactsByDataIds(dataIds: string[]): Promise<KnowledgeFact[]> {
  const client = getKnowledgeClient()
  if (!client || dataIds.length === 0) return []
  try {
    const rows = await client.fetch<KnowledgeFact[]>(
      `*[${CURRENT_FACT} && dataId in $dataIds] ${FACT_PROJECTION}`,
      { dataIds },
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.warn('[knowledge] fact lookup failed:', err)
    return []
  }
}

export type FactSearchInput = {
  query?: string
  category?: string
  citySlug?: string
  season?: string
  limit?: number
}

/**
 * Metadata filter first, free text second. No vector index: with a few hundred
 * facts the category/city/season filters plus a `match` on `searchText` (which
 * carries the Albanian terms as well as the English metric names) resolve the
 * follow-up questions the prompt snapshot cannot answer on its own.
 */
export async function searchKnowledgeFacts(input: FactSearchInput): Promise<KnowledgeFact[]> {
  const client = getKnowledgeClient()
  if (!client) return []
  const limit = Math.min(Math.max(input.limit ?? 12, 1), 30)
  const filters = [CURRENT_FACT]
  const params: Record<string, unknown> = {}

  if (input.category) {
    filters.push('category == $category')
    params.category = input.category
  }
  // National facts (tariffs, taxes) answer a city question too, so they are
  // never filtered out by a city constraint.
  if (input.citySlug) {
    filters.push('(city->slug.current == $citySlug || !defined(city))')
    params.citySlug = input.citySlug
  }
  if (input.season) {
    filters.push('(season == $season || season == "annual")')
    params.season = input.season
  }
  if (input.query?.trim()) {
    filters.push('(searchText match $query || title match $query || metric match $query)')
    // GROQ `match` is token-prefix based; a trailing star widens "tarif" to
    // "tarifa" without turning the whole query into a substring scan.
    params.query = `${input.query.trim().split(/\s+/).slice(0, 8).join(' ')}*`
  }

  // When a city is asked for, its own facts come first. Sorting by confidence
  // alone buried them: the national tariffs and the Albania-wide STR averages
  // are HIGH and sort ahead of every city row, so a question about Sarandë came
  // back with nothing about Sarandë in it.
  const cityFirst = input.citySlug ? 'select(defined(city) => 0, 1) asc,' : ''

  try {
    const rows = await client.fetch<KnowledgeFact[]>(
      `*[${filters.join(' && ')}] | order(
        ${cityFirst}
        select(confidence == "HIGH" => 0, confidence == "MEDIUM" => 1, 2) asc,
        dataId asc
      ) [0...$limit] ${FACT_PROJECTION}`,
      { ...params, limit },
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.warn('[knowledge] fact search failed:', err)
    return []
  }
}

/* -------------------------------------------------------------- articles -- */

const ARTICLE_SUMMARY_PROJECTION = (locale: string) => `{
  documentId,
  "slug": slug.current,
  "title": coalesce(title.${locale}, title.en),
  "summary": coalesce(summary.${locale}, summary.en),
  category,
  "citySlug": city->slug.current,
  dataPeriod,
  confidence,
  lastUpdated,
  "questionCount": count(questionSet)
}`

async function fetchIndex(locale: string): Promise<KnowledgeArticleSummary[]> {
  const client = getKnowledgeClient()
  if (!client) return []
  try {
    const rows = await client.fetch<KnowledgeArticleSummary[]>(
      `*[_type == "knowledgeArticle" && isPublished == true] | order(category asc, documentId asc) ${ARTICLE_SUMMARY_PROJECTION(locale)}`,
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.warn('[knowledge] index fetch failed:', err)
    return []
  }
}

export const fetchKnowledgeIndex = sanityCache(fetchIndex, ['knowledge-index'], {
  revalidate: 3600,
  tags: [SANITY_TAGS.knowledgeArticle],
})

async function fetchArticle(slug: string, locale: string): Promise<KnowledgeArticle | null> {
  const client = getKnowledgeClient()
  if (!client || !slug) return null
  const query = `*[_type == "knowledgeArticle" && slug.current == $slug && isPublished == true][0]{
    documentId,
    "slug": slug.current,
    "title": coalesce(title.${locale}, title.en),
    "summary": coalesce(summary.${locale}, summary.en),
    category,
    "citySlug": city->slug.current,
    dataPeriod,
    confidence,
    lastUpdated,
    nextReviewAt,
    exchangeRateNote,
    sourceFile,
    "questionCount": count(questionSet),
    "questions": questionSet[]{"v": coalesce(${locale}, en)}.v,
    "gaps": gaps[]{gapId, "description": coalesce(description.${locale}, description.en), priority},
    "relatedArticles": relatedArticles[]->{"slug": slug.current, "title": coalesce(title.${locale}, title.en)},
    sections[]{
      sectionKey,
      "heading": coalesce(heading.${locale}, heading.en),
      "body": coalesce(body.${locale}, body.en),
      tables[]{
        tableId,
        "title": coalesce(title.${locale}, title.en),
        "columns": columns[]{"v": coalesce(${locale}, en)}.v,
        "methodology": coalesce(methodology.${locale}, methodology.en),
        confidence,
        rows[]{
          rowId,
          cells,
          "facts": facts[]->${FACT_PROJECTION}
        }
      }
    }
  }`
  try {
    const row = await client.fetch<KnowledgeArticle | null>(query, { slug })
    return row ?? null
  } catch (err) {
    console.warn('[knowledge] article fetch failed:', err)
    return null
  }
}

export const fetchKnowledgeArticle = sanityCache(fetchArticle, ['knowledge-article'], {
  revalidate: 3600,
  tags: [SANITY_TAGS.knowledgeArticle, SANITY_TAGS.knowledgeFact, SANITY_TAGS.knowledgeSource],
})

async function fetchSlugs(): Promise<string[]> {
  const client = getKnowledgeClient()
  if (!client) return []
  try {
    const rows = await client.fetch<string[]>(
      `*[_type == "knowledgeArticle" && isPublished == true].slug.current`,
    )
    return Array.isArray(rows) ? rows.filter(Boolean) : []
  } catch {
    return []
  }
}

export const fetchKnowledgeSlugs = sanityCache(fetchSlugs, ['knowledge-slugs'], {
  revalidate: 3600,
  tags: [SANITY_TAGS.knowledgeArticle],
})

/* ---------------------------------------------------------------- helpers -- */

/** Human label for a fact's figure: "0.11 EUR/kWh", "450–650 EUR/month". */
export function formatFactValue(fact: KnowledgeFact): string {
  const unit = fact.unit && fact.unit !== 'text' ? ` ${fact.unit}` : ''
  if (typeof fact.valueLow === 'number' && typeof fact.valueHigh === 'number') {
    return `${fact.valueLow}–${fact.valueHigh}${unit}`
  }
  if (typeof fact.value === 'number') return `${fact.value}${unit}`
  return fact.valueText?.split('\n')[0]?.slice(0, 80) ?? ''
}

export { resolveLocalizedString }
