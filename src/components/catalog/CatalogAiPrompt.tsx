'use client'

import { useTranslations } from 'next-intl'
import AiSearchInput from '@/components/ai/AiSearchInput'
import { cn } from '@/lib/utils'

/**
 * The assistant's field inside the listings: a full row after the first few
 * cards, for the visitor who scrolled and did not see their flat. Filters
 * cover price, rooms and city; "quiet, near a school, for renting out" only
 * the assistant can read.
 */
export function CatalogAiPrompt({ locale, empty = false }: { locale: string; empty?: boolean }) {
  const t = useTranslations('AiSearch')
  return (
    <div
      className={cn(
        'min-w-0 col-span-full rounded-2xl p-5 sm:p-6',
        empty ? 'mt-10 w-full' : 'border border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10',
      )}
    >
      <p className="mb-3 text-base font-medium text-dark dark:text-white sm:text-lg">
        {empty ? t('catalogEmptyTitle') : t('catalogTitle')}
      </p>
      <AiSearchInput
        locale={locale}
        tone="surface"
        from={empty ? 'catalog_empty' : 'catalog'}
        hint={t('catalogHint')}
        className={empty ? 'mx-auto text-left' : undefined}
      />
    </div>
  )
}
