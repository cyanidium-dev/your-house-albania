import { Icon } from '@/components/shared/Icon'
import { cn } from '@/lib/utils'
import type { KnowledgeFact, KnowledgeTable as KnowledgeTableData } from '@/lib/sanity/queries/knowledge'

/**
 * One table of the knowledge base, rendered so that a single line of it can be
 * cited and linked to.
 *
 * Every row carries `id={dataId}` of the first fact behind it, so a citation
 * from the assistant (`/knowledge/…#DATA-ELEC-0001`) lands on the exact line
 * rather than on the page, and `:target` highlights it once it does. Under the
 * table sits the provenance: each fact with its value, how far it can be
 * trusted, when it was last checked and where it came from.
 *
 * A server component on purpose — `<details>` collapses without JavaScript, and
 * a data table should not wait on a bundle.
 */

const CONFIDENCE_DOT: Record<string, string> = {
  HIGH: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-orange-500',
  ESTIMATE: 'bg-sky-500',
  FORECAST: 'bg-violet-500',
}

/**
 * Which row owns the anchor for each fact.
 *
 * A fact usually backs several rows across a page — a tariff appears in the
 * table that states it and again in the worked examples — and repeating
 * `id="DATA-ELEC-0001"` three times is invalid HTML that sends a citation to
 * whichever copy the browser happens to pick. The first row that cites a fact
 * keeps the bare id; the others fall back to a table-scoped one.
 */
export function assignRowAnchors(
  sections: { tables?: { tableId: string; rows?: { rowId: string; facts?: { dataId: string }[] }[] }[] }[],
): Map<string, string> {
  const anchors = new Map<string, string>()
  const claimed = new Set<string>()
  for (const section of sections ?? []) {
    for (const table of section.tables ?? []) {
      for (const row of table.rows ?? []) {
        const key = `${table.tableId}#${row.rowId}`
        const dataId = row.facts?.[0]?.dataId
        if (dataId && !claimed.has(dataId)) {
          claimed.add(dataId)
          anchors.set(key, dataId)
        } else {
          anchors.set(key, `${table.tableId}-${row.rowId}`)
        }
      }
    }
  }
  return anchors
}

export type KnowledgeTableLabels = {
  sources: string
  confidence: string
  period: string
  verified: string
  /** "Estimate", shown on derived rows. */
  estimate: string
  method: string
}

function factValue(fact: KnowledgeFact): string {
  const unit = fact.unit && fact.unit !== 'text' ? ` ${fact.unit}` : ''
  if (typeof fact.valueLow === 'number' && typeof fact.valueHigh === 'number') {
    return `${fact.valueLow}–${fact.valueHigh}${unit}`
  }
  if (typeof fact.value === 'number') return `${fact.value}${unit}`
  return (fact.valueText ?? '').split('\n')[0]
}

export default function KnowledgeTable({
  table,
  labels,
  anchors,
}: {
  table: KnowledgeTableData
  labels: KnowledgeTableLabels
  /** Row anchor ids from `assignRowAnchors`, so no id repeats on the page. */
  anchors?: Map<string, string>
}) {
  const rows = table.rows ?? []
  const facts = rows.flatMap((row) => row.facts ?? [])
  const seen = new Set<string>()
  const uniqueFacts = facts.filter((fact) => {
    if (!fact?.dataId || seen.has(fact.dataId)) return false
    seen.add(fact.dataId)
    return true
  })

  return (
    <figure className="my-8" id={table.tableId}>
      {table.title ? (
        <figcaption className="mb-3 text-base font-semibold text-dark dark:text-white">
          {table.title}
        </figcaption>
      ) : null}

      {/* Wide tables scroll inside their own box; the page never does. */}
      <div className="overflow-x-auto rounded-xl border border-dark/10 dark:border-white/15">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-dark/4 text-left dark:bg-white/6">
              {(table.columns ?? []).map((column, index) => (
                <th
                  key={`${table.tableId}-h-${index}`}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2.5 font-semibold text-dark dark:text-white"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const anchor =
                anchors?.get(`${table.tableId}#${row.rowId}`) ?? row.facts?.[0]?.dataId
              return (
                <tr
                  key={`${table.tableId}-${row.rowId}`}
                  id={anchor}
                  className={cn(
                    'border-t border-dark/8 align-top scroll-mt-28 dark:border-white/10',
                    'target:bg-primary/10',
                  )}
                >
                  {(row.cells ?? []).map((cell, index) => (
                    <td
                      key={`${table.tableId}-${row.rowId}-${index}`}
                      className="px-3 py-2.5 text-dark/80 dark:text-white/80"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {table.methodology ? (
        <p className="mt-3 text-sm text-dark/60 dark:text-white/60">
          <span className="font-medium">{labels.method}: </span>
          {table.methodology}
        </p>
      ) : null}

      {uniqueFacts.length > 0 ? (
        <details className="mt-3 rounded-xl border border-dark/10 px-4 py-3 dark:border-white/15">
          <summary className="cursor-pointer list-none text-sm font-medium text-dark/70 hover:text-primary dark:text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="ph:list-magnifying-glass" width={15} height={15} aria-hidden />
              {labels.sources} · {uniqueFacts.length}
            </span>
          </summary>
          <ul className="mt-3 space-y-2.5">
            {uniqueFacts.map((fact) => (
              <li key={fact.dataId} className="text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      CONFIDENCE_DOT[fact.confidence] ?? CONFIDENCE_DOT.MEDIUM,
                    )}
                    aria-hidden
                  />
                  <a
                    href={`#${fact.dataId}`}
                    className="font-mono text-xs text-dark/50 hover:text-primary dark:text-white/50"
                  >
                    {fact.dataId}
                  </a>
                  <span className="font-medium text-dark dark:text-white">{factValue(fact)}</span>
                  <span className="text-dark/60 dark:text-white/60">{fact.title ?? fact.metric}</span>
                </div>
                <div className="ml-3.5 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark/50 dark:text-white/50">
                  <span>
                    {labels.confidence}: {fact.confidence}
                    {fact.confidence === 'ESTIMATE' || fact.confidence === 'FORECAST'
                      ? ` (${labels.estimate})`
                      : ''}
                  </span>
                  <span>
                    {labels.period}: {fact.period}
                  </span>
                  {fact.lastVerifiedAt ? (
                    <span>
                      {labels.verified} {fact.lastVerifiedAt}
                    </span>
                  ) : null}
                  {fact.source ? (
                    fact.source.url ? (
                      <a
                        href={fact.source.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        <Icon icon="ph:arrow-square-out" width={12} height={12} aria-hidden />
                        {fact.source.name}
                      </a>
                    ) : (
                      <span>{fact.source.name}</span>
                    )
                  ) : null}
                </div>
                {fact.methodology ? (
                  <p className="ml-3.5 mt-1 text-xs text-dark/50 dark:text-white/50">
                    {fact.methodology}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </figure>
  )
}
