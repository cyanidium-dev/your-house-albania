'use client'

import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import AiSearchChat from '@/components/ai/AiSearchChat'
import { track } from '@/lib/analytics/track'
import { cn } from '@/lib/utils'

/**
 * "Ask about this listing" on a property page.
 *
 * Collapsed until asked for. A chat that mounts open would start a streaming
 * connection for every visitor who scrolled past it, and most of them came to
 * look at photographs.
 */
export default function AiPropertyPanel({
  locale,
  propertySlug,
}: {
  locale: string
  propertySlug: string
}) {
  const t = useTranslations('AiSearch')
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-10 rounded-2xl border border-dark/10 bg-white p-5 dark:border-white/10 dark:bg-white/5 sm:p-7">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden
        >
          <Icon icon="ph:sparkle" width={20} height={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            {t('property.heading')}
          </h2>
          <p className="mt-1 text-dark/60 dark:text-white/60">{t('property.subheading')}</p>
        </div>
      </div>

      {open ? (
        <div className="mt-6">
          <AiSearchChat locale={locale} propertySlug={propertySlug} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            track({ event: 'ai_search_open', entry: 'direct' })
          }}
          className={cn(
            'mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3',
            'font-semibold text-white transition-colors duration-200 hover:bg-dark',
            'dark:hover:bg-white dark:hover:text-dark',
          )}
        >
          {t('property.openCta')}
          <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
        </button>
      )}
    </section>
  )
}
