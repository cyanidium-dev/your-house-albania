'use client'

import { useTranslations } from 'next-intl'
import { QuickLeadForm } from './QuickLeadForm'

type Props = {
  locale: string
  /** CMS override for the card heading; falls back to the dictionary. */
  heading?: string
  /** CMS override for the supporting line; falls back to the dictionary. */
  body?: string
  /** Article slug (or other identifier) so Telegram shows which post produced the lead. */
  sourceLabel?: string
}

/**
 * In-article callback card. Replaces the old "calculate the cost" CTA, which
 * sent readers to a calculator and asked them to do the work themselves —
 * this asks for a phone number instead and promises a quote within an hour.
 */
export function BlogQuoteCta({ locale, heading, body, sourceLabel }: Props) {
  const t = useTranslations('QuickLead')

  return (
    <aside className="my-10 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
      <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        {t('badge')}
      </p>
      <h3 className="text-xl font-medium text-dark dark:text-white sm:text-2xl">
        {heading?.trim() || t('heading')}
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-dark/70 dark:text-white/70">
        {body?.trim() || t('body')}
      </p>
      <QuickLeadForm
        locale={locale}
        sourceLabel={sourceLabel ? `Blog: ${sourceLabel}` : 'Blog article'}
        className="mt-5"
      />
    </aside>
  )
}
