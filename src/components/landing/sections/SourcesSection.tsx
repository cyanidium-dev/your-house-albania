import * as React from 'react'
import { useTranslations } from 'next-intl'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { formatBlogDate } from '@/lib/date/formatLocale'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type SourceItem = {
  _key?: string
  label?: string
  url?: string
  publisher?: string
  date?: string
}

type SourcesSectionShape = {
  enabled?: boolean
  title?: unknown
  intro?: unknown
  sources?: unknown[]
  methodologyNote?: unknown
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * "Sources & methodology" page-footer block: compact numbered reference list
 * ("label — publisher, date") plus a collapsible methodology note.
 * Restrained styling on purpose — this is a trust/AEO block, not a marketing one.
 */
export function SourcesSection({
  locale,
  section,
}: {
  locale: string
  section: SourcesSectionShape
}) {
  const t = useTranslations('Landing')
  if (section.enabled === false) return null

  const sources = ((Array.isArray(section.sources) ? section.sources : []) as SourceItem[]).filter(
    (s) => s && typeof s.url === 'string' && s.url.trim() && typeof s.label === 'string' && s.label.trim(),
  )
  if (sources.length === 0) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const intro = resolveLocalizedString(section.intro as never, locale) || ''
  const methodologyNote = resolveLocalizedString(section.methodologyNote as never, locale) || ''

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {title ? (
          <h2 className="text-xl sm:text-2xl font-medium text-dark dark:text-white">{title}</h2>
        ) : null}
        {intro ? (
          <p className="mt-2 max-w-3xl text-sm text-dark/55 dark:text-white/55 whitespace-pre-line">
            {intro}
          </p>
        ) : null}

        <ol className="mt-5 list-decimal pl-5 flex flex-col gap-1.5 text-sm text-dark/70 dark:text-white/70 marker:text-dark/40 dark:marker:text-white/40">
          {sources.map((s, i) => {
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

        {methodologyNote ? (
          <Accordion type="single" collapsible className="mt-6 max-w-3xl">
            <AccordionItem value="methodology">
              <AccordionTrigger className="p-4 text-base">{t('methodology')}</AccordionTrigger>
              <AccordionContent className="px-4 text-sm whitespace-pre-line">
                {methodologyNote}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}
      </div>
    </section>
  )
}
