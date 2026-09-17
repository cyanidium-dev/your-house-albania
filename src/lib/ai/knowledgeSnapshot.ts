/**
 * The research knowledge base, compressed into a cacheable prompt block.
 *
 * Same bet as the catalog snapshot: with a few hundred facts it is cheaper and
 * far more accurate to hand the model everything once — cached, so the second
 * visitor pays a tenth of the price — than to make it guess which retrieval
 * query to run. The model then answers utility, rent and yield questions from
 * data that carries a `data_id`, and `lookup_facts` exists only for the long
 * tail the snapshot summarises away.
 *
 * English, no timestamps, stable ordering: the block has to be a byte-for-byte
 * prefix match across locales and requests or prompt caching stops paying.
 */

import { fetchKnowledgeFactRows, fetchKnowledgeIndex, type KnowledgeFact } from '@/lib/sanity/queries/knowledge'
import { sliceSafe, stripLoneSurrogates } from './text'

/** Characters of the researched value kept per fact. */
const VALUE_CHARS = 110

export type KnowledgeSnapshot = {
  /** One line per fact, ready to paste into the system prompt. */
  lines: string[]
  /** Published pages a citation can link to. */
  articles: { documentId: string; slug: string; title: string; category: string }[]
  /** Facts by confidence, so the prompt can state what the corpus is made of. */
  counts: { total: number; high: number; medium: number; low: number; derived: number }
  categories: string[]
}

const EMPTY: KnowledgeSnapshot = {
  lines: [],
  articles: [],
  counts: { total: 0, high: 0, medium: 0, low: 0, derived: 0 },
  categories: [],
}

function compact(value: string | undefined, limit: number): string {
  const flat = stripLoneSurrogates((value ?? '').replace(/\s+/g, ' ').trim())
  if (flat.length <= limit) return flat
  return `${sliceSafe(flat, limit).trimEnd()}…`
}

/** "0.11 EUR/kWh" · "450–650 EUR/month" · "" when the fact is a rule. */
function figure(fact: KnowledgeFact): string {
  const unit = fact.unit && fact.unit !== 'text' ? ` ${fact.unit}` : ''
  if (typeof fact.valueLow === 'number' && typeof fact.valueHigh === 'number') {
    return `${fact.valueLow}–${fact.valueHigh}${unit}`
  }
  if (typeof fact.value === 'number') return `${fact.value}${unit}`
  return ''
}

export function buildKnowledgeSnapshot(
  facts: KnowledgeFact[],
  articles: { documentId: string; slug: string; title: string; category: string }[],
): KnowledgeSnapshot {
  const lines: string[] = []
  const counts = { total: 0, high: 0, medium: 0, low: 0, derived: 0 }
  const categories = new Set<string>()

  for (const fact of facts) {
    if (!fact.dataId) continue
    counts.total += 1
    if (fact.confidence === 'HIGH') counts.high += 1
    else if (fact.confidence === 'MEDIUM') counts.medium += 1
    else if (fact.confidence === 'LOW') counts.low += 1
    else counts.derived += 1
    if (fact.category) categories.add(fact.category)

    const where = fact.citySlug || fact.geography || 'Albania'
    const cells = [
      fact.dataId,
      fact.category,
      compact(where, 40),
      figure(fact) || '—',
      fact.period,
      fact.season && fact.season !== 'annual' ? fact.season : '',
      fact.confidence,
      compact(fact.title || fact.valueText, VALUE_CHARS),
    ]
    lines.push(cells.filter((cell) => cell !== '').join(' | '))
  }

  return { lines, articles, counts, categories: [...categories].sort() }
}

async function fetchKnowledgeSnapshot(): Promise<KnowledgeSnapshot> {
  try {
    const [facts, index] = await Promise.all([fetchKnowledgeFactRows(), fetchKnowledgeIndex('en')])
    if (facts.length === 0) return EMPTY
    return buildKnowledgeSnapshot(
      facts,
      index.map((a) => ({
        documentId: a.documentId,
        slug: a.slug,
        title: a.title,
        category: a.category,
      })),
    )
  } catch (err) {
    console.warn('[ai] knowledge snapshot failed:', err)
    return EMPTY
  }
}

/**
 * Not wrapped in `sanityCache` here: both halves are already cached fetchers
 * with the right tags, and this only reshapes them. A module-level memo keeps
 * the reshaping off the hot path within one server instance.
 */
let memo: { at: number; value: Promise<KnowledgeSnapshot> } | null = null
const MEMO_MS = 60_000

export function getKnowledgeSnapshot(): Promise<KnowledgeSnapshot> {
  const now = Date.now()
  if (!memo || now - memo.at > MEMO_MS) {
    memo = { at: now, value: fetchKnowledgeSnapshot() }
  }
  return memo.value
}

export const __testables = { buildKnowledgeSnapshot, figure, compact }
