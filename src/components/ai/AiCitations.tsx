'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '@/components/shared/Icon'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics/track'
import type { AiCitation } from '@/lib/ai/knowledgeTools'

/**
 * Sources under an assistant answer.
 *
 * The assistant is allowed to quote tariffs, rents and yields precisely because
 * every figure traces to a named source with a date. That is worth nothing if
 * the visitor cannot see it, so each fact becomes a chip: what it says, how
 * much it can be trusted, when it was last checked, and where it came from.
 *
 * Collapsed to a single line by default — the answer is the point, the
 * provenance is there for whoever wants it.
 */

const CONFIDENCE_STYLE: Record<string, { dot: string; label: string }> = {
  HIGH: { dot: 'bg-emerald-500', label: 'official or corroborated' },
  MEDIUM: { dot: 'bg-amber-500', label: 'established source, narrower sample' },
  LOW: { dot: 'bg-orange-500', label: 'thin sample — treat as indicative' },
  ESTIMATE: { dot: 'bg-sky-500', label: 'calculated, not measured' },
  FORECAST: { dot: 'bg-violet-500', label: 'scenario, not a prediction' },
}

/** Anything older than this is worth flagging when a tariff is quoted. */
const STALE_DAYS = 200

function isStale(iso?: string): boolean {
  if (!iso) return false
  const at = Date.parse(`${iso}T00:00:00Z`)
  if (Number.isNaN(at)) return false
  return Date.now() - at > STALE_DAYS * 24 * 60 * 60 * 1000
}

export default function AiCitations({
  items,
  labels,
}: {
  items: AiCitation[]
  labels: { heading: string; verified: string; mayHaveChanged: string }
}) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null

  return (
    <div className="pl-11">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value)
          if (!open) track({ event: 'ai_sources_open', count: items.length })
        }}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-dark/10 px-3 py-1 text-xs text-dark/60 transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-white/60"
      >
        <Icon icon="ph:list-magnifying-glass" width={14} height={14} aria-hidden />
        {labels.heading} · {items.length}
        <Icon
          icon={open ? 'ph:caret-up' : 'ph:caret-down'}
          width={12}
          height={12}
          aria-hidden
        />
      </button>

      {open ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => {
            const style = CONFIDENCE_STYLE[item.confidence] ?? CONFIDENCE_STYLE.MEDIUM
            const stale = isStale(item.lastVerifiedAt)
            return (
              <li
                key={item.dataId}
                className="rounded-lg border border-dark/8 bg-dark/2 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span
                    className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', style.dot)}
                    title={`${item.confidence} — ${style.label}`}
                    aria-hidden
                  />
                  <span className="font-medium text-dark dark:text-white">{item.value}</span>
                  <span className="text-dark/60 dark:text-white/60">{item.label}</span>
                  <span className="text-dark/40 dark:text-white/40">{item.period}</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-dark/50 dark:text-white/50">
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 hover:text-primary"
                      onClick={() => track({ event: 'ai_source_click', dataId: item.dataId })}
                    >
                      <Icon icon="ph:arrow-square-out" width={12} height={12} aria-hidden />
                      {item.sourceName ?? item.dataId}
                    </a>
                  ) : (
                    <span>{item.sourceName ?? item.dataId}</span>
                  )}

                  {item.articlePath ? (
                    <Link
                      href={item.articlePath}
                      className="inline-flex items-center gap-1 hover:text-primary"
                      onClick={() => track({ event: 'ai_knowledge_click', dataId: item.dataId })}
                    >
                      <Icon icon="ph:table" width={12} height={12} aria-hidden />
                      {item.dataId}
                    </Link>
                  ) : (
                    <span className="opacity-70">{item.dataId}</span>
                  )}

                  {item.lastVerifiedAt ? (
                    <span className={cn(stale && 'text-amber-600 dark:text-amber-400')}>
                      {labels.verified} {item.lastVerifiedAt}
                      {stale ? ` · ${labels.mayHaveChanged}` : ''}
                    </span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
