import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { ExternalLink } from 'lucide-react'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { formatBlogDate } from '@/lib/date/formatLocale'
import { isIndexingEnabled } from '@/lib/seo/envSeo'
import { portableTextToPlainText } from '@/lib/sanity/portableTextPlain'
import { FaqJsonLd, type FaqJsonLdItem } from '@/components/shared/FaqJsonLd'
import { resolveFaqDataFromSection } from '@/components/landing/sectionRenderers/helpers'
import type { TrackerDoc } from '@/lib/sanity/client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { asTrackerStatus, StatusBadge, type TrackerStatus } from './impl/StatusBadge'
import { SourcesList } from './impl/SourcesList'

const VISIBLE_TIMELINE_EVENTS = 6

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function TimelineItem({
  date,
  event,
  sourceUrl,
}: {
  date: string
  event: string
  sourceUrl?: string
}) {
  return (
    <li className="relative pl-6 pb-5 last:pb-0 border-l border-dark/10 dark:border-white/15 ml-1.5">
      <span
        className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-dark"
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="shrink-0 text-xs font-semibold tabular-nums text-dark/50 dark:text-white/50 whitespace-nowrap">
          {date}
        </span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="nofollow noopener"
            className="inline-flex text-dark/40 dark:text-white/40 hover:text-primary transition-colors"
            aria-label={sourceUrl}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
      <p className="mt-0.5 text-sm leading-relaxed text-dark/80 dark:text-white/80 whitespace-pre-line">
        {event}
      </p>
    </li>
  )
}

/**
 * Renders a `tracker` document (full: status + timeline + FAQ + sources;
 * compact: one status card). The document is fetched by the handler; a missing
 * or unpublished ref renders nothing there.
 */
export async function TrackerSection({
  locale,
  tracker,
  displayMode,
  titleOverride,
  emitFaqJsonLd,
}: {
  locale: string
  tracker: TrackerDoc
  displayMode: 'full' | 'compact'
  titleOverride?: string
  /** Decided by the handler (single-FAQPage-per-page rule, claimed in loop order). */
  emitFaqJsonLd?: boolean
}) {
  const t = await getTranslations('Trackers')

  const status: TrackerStatus = asTrackerStatus(tracker.currentStatus) ?? 'onTrack'
  const statusLabel =
    resolveLocalizedString(tracker.statusLabel as never, locale) ||
    t(
      status === 'onTrack'
        ? 'statusOnTrack'
        : status === 'delayed'
          ? 'statusDelayed'
          : status === 'blocked'
            ? 'statusBlocked'
            : 'statusDone',
    )
  const title = titleOverride || resolveLocalizedString(tracker.title as never, locale) || ''
  const subject = resolveLocalizedString(tracker.subject as never, locale)
  const summary = resolveLocalizedString(tracker.statusSummary as never, locale)
  const checkedDate = parseDate(tracker.lastCheckedAt)
  const checkedLine = checkedDate
    ? t('checkedAt', { date: formatBlogDate(checkedDate, locale) })
    : ''

  if (displayMode === 'compact') {
    return (
      <section className="py-8 md:py-10">
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
          <div className="rounded-2xl border border-dark/10 dark:border-white/15 p-5 sm:p-6 max-w-xl">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={status} label={statusLabel} />
              {checkedLine ? (
                <span className="text-xs text-dark/50 dark:text-white/50">{checkedLine}</span>
              ) : null}
            </div>
            {title ? (
              <h3 className="mt-3 text-lg font-semibold text-dark dark:text-white">{title}</h3>
            ) : null}
            {summary ? (
              <p className="mt-1.5 text-sm leading-relaxed text-dark/65 dark:text-white/65 line-clamp-2 whitespace-pre-line">
                {summary}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  // Timeline (already ordered newest-first by the query).
  const events = (Array.isArray(tracker.timeline) ? tracker.timeline : [])
    .map((e, i) => {
      const date = parseDate(e.date)
      const text = resolveLocalizedString(e.event as never, locale)
      if (!date || !text) return null
      return {
        key: e._key ?? String(i),
        date: formatBlogDate(date, locale),
        event: text,
        sourceUrl: typeof e.sourceUrl === 'string' && e.sourceUrl.trim() ? e.sourceUrl : undefined,
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
  const visibleEvents = events.slice(0, VISIBLE_TIMELINE_EVENTS)
  const hiddenEvents = events.slice(VISIBLE_TIMELINE_EVENTS)

  // FAQ: same item shape as `faqSection`, resolved by the shared helper.
  const faqData = resolveFaqDataFromSection({ items: tracker.faq ?? [] }, locale)
  let faqLd: React.ReactNode = null
  if (emitFaqJsonLd && isIndexingEnabled() && faqData?.items?.length) {
    const items: FaqJsonLdItem[] = faqData.items.map((item) => ({
      question: item.question,
      answer: typeof item.answer === 'string' ? item.answer : portableTextToPlainText(item.answer),
    }))
    faqLd = <FaqJsonLd items={items} />
  }

  const sources = Array.isArray(tracker.sources) ? tracker.sources : []

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {faqLd}
        <div className="max-w-3xl">
          {title ? (
            <h2 className="text-3xl sm:text-4xl lg:text-52 font-medium text-dark dark:text-white leading-[1.15]">
              {title}
            </h2>
          ) : null}
          {subject ? (
            <p className="mt-2 text-base text-dark/55 dark:text-white/55">{subject}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <StatusBadge status={status} label={statusLabel} />
            {checkedLine ? (
              <span className="text-sm text-dark/50 dark:text-white/50">{checkedLine}</span>
            ) : null}
          </div>
          {summary ? (
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-dark/80 dark:text-white/80 whitespace-pre-line">
              {summary}
            </p>
          ) : null}
        </div>

        {visibleEvents.length > 0 ? (
          <div className="mt-10 max-w-3xl">
            <ol className="flex flex-col">
              {visibleEvents.map((e) => (
                <TimelineItem key={e.key} date={e.date} event={e.event} sourceUrl={e.sourceUrl} />
              ))}
            </ol>
            {hiddenEvents.length > 0 ? (
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="all-events">
                  <AccordionTrigger className="p-3 text-sm bg-transparent dark:bg-transparent ring-1 ring-dark/10 dark:ring-white/10">
                    {t('showAllEvents', { count: events.length })}
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pt-4">
                    <ol className="flex flex-col">
                      {hiddenEvents.map((e) => (
                        <TimelineItem
                          key={e.key}
                          date={e.date}
                          event={e.event}
                          sourceUrl={e.sourceUrl}
                        />
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
          </div>
        ) : null}

        {faqData?.items?.length ? (
          <div className="mt-12 max-w-3xl">
            <h3 className="text-xl sm:text-2xl font-medium text-dark dark:text-white mb-4">
              {t('faqTitle')}
            </h3>
            <Accordion type="single" collapsible className="flex flex-col gap-3">
              {faqData.items.map((item, idx) => (
                <AccordionItem key={idx} value={`tracker-faq-${idx}`}>
                  <AccordionTrigger className="p-4 text-base">{item.question}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line">
                    {typeof item.answer === 'string'
                      ? item.answer
                      : portableTextToPlainText(item.answer)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : null}

        {sources.length > 0 ? (
          <div className="mt-12 max-w-3xl">
            <h3 className="text-lg font-medium text-dark dark:text-white mb-3">
              {t('sourcesTitle')}
            </h3>
            <SourcesList items={sources} locale={locale} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
