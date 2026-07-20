import * as React from 'react'
import { useTranslations } from 'next-intl'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { SourcesList, type SourcesListItem } from '@/components/landing/sections/impl/SourcesList'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type SourceItem = SourcesListItem

type SourcesSectionShape = {
  enabled?: boolean
  title?: unknown
  intro?: unknown
  sources?: unknown[]
  methodologyNote?: unknown
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

        <div className="mt-5">
          <SourcesList items={sources} locale={locale} />
        </div>

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
