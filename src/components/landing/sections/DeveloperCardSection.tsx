import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { DeveloperDoc } from '@/lib/sanity/client'
import { DeveloperCard } from './impl/DeveloperCard'

/**
 * Single expanded developer card for district pages / guides.
 * The disclaimer here is the standard dictionary one-liner
 * (`Developers.disclaimerShort`) instead of a duplicated CMS field: the legal
 * caution text must be identical everywhere it appears, and a per-section
 * field would drift.
 */
export async function DeveloperCardSection({
  locale,
  section,
  developer,
}: {
  locale: string
  section: { title?: unknown }
  developer: DeveloperDoc
}) {
  const t = await getTranslations('Developers')
  const title = resolveLocalizedString(section.title as never, locale)

  return (
    <section className="py-10 md:py-14">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="max-w-2xl">
          {title ? (
            <h2 className="mb-4 text-2xl sm:text-3xl font-medium text-dark dark:text-white leading-[1.15]">
              {title}
            </h2>
          ) : null}
          <DeveloperCard locale={locale} developer={developer} />
          <p className="mt-2 text-xs text-dark/50 dark:text-white/50">{t('disclaimerShort')}</p>
        </div>
      </div>
    </section>
  )
}
