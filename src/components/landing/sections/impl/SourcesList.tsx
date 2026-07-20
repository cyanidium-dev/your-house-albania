import * as React from 'react'
import { formatBlogDate } from '@/lib/date/formatLocale'

export type SourcesListItem = {
  _key?: string
  label?: string
  url?: string
  publisher?: string
  date?: string
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Compact numbered source list ("label — publisher, date", nofollow external
 * links). Shared by `sourcesSection`, tracker and developer renderers.
 */
export function SourcesList({
  items,
  locale,
}: {
  items: SourcesListItem[]
  locale: string
}) {
  const valid = (Array.isArray(items) ? items : []).filter(
    (s) => s && typeof s.url === 'string' && s.url.trim() && typeof s.label === 'string' && s.label.trim(),
  )
  if (valid.length === 0) return null

  return (
    <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-sm text-dark/70 dark:text-white/70 marker:text-dark/40 dark:marker:text-white/40">
      {valid.map((s, i) => {
        const date = parseDate(s.date)
        const meta = [s.publisher?.trim(), date ? formatBlogDate(date, locale) : null]
          .filter(Boolean)
          .join(', ')
        return (
          <li key={s._key ?? i} className="pl-1">
            <a
              href={s.url}
              target="_blank"
              rel="nofollow noopener"
              className="text-dark/80 dark:text-white/80 underline decoration-dark/20 dark:decoration-white/20 underline-offset-2 hover:text-primary hover:decoration-primary transition-colors"
            >
              {s.label}
            </a>
            {meta ? <span className="text-dark/50 dark:text-white/50"> — {meta}</span> : null}
          </li>
        )
      })}
    </ol>
  )
}
