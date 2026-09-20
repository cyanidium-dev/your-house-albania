'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import { useContactModalFlag } from '@/lib/contacts/useContactModalFlag'
import type { LeadPlacement } from '@/lib/leads/types'

type Props = {
  locale: string
  /** Localized button label (rendered server-side). */
  label: string
  className?: string
  placement?: LeadPlacement
  /** Tells the operator where the callback request came from. */
  sourceLabel: string
}

/**
 * "Get help choosing" on a listing page: opens the site's phone-only callback
 * form (`QuickLeadForm`) in the same dialog shell the property inquiry uses.
 */
export function HelpChoosingButton({ locale, label, className, placement = 'catalog', sourceLabel }: Props) {
  const t = useTranslations('QuickContact')
  const tp = useTranslations('Shared.propertyDetail')
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  useContactModalFlag(open)

  const close = React.useCallback(() => setOpen(false), [])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={t('formHeading')}
            >
              <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden />
              <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-dark sm:p-8">
                <button
                  type="button"
                  onClick={close}
                  aria-label={tp('contactClose')}
                  className="absolute right-4 top-4 rounded-full p-1 text-dark/50 hover:text-dark dark:text-white/50 dark:hover:text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
                <h3 className="pr-8 text-xl font-medium text-dark dark:text-white">{t('formHeading')}</h3>
                <p className="mt-1 text-sm text-dark/60 dark:text-white/60">{t('formBody')}</p>
                <QuickLeadForm
                  locale={locale}
                  sourceLabel={sourceLabel}
                  placement={placement}
                  withName
                  stacked
                  className="mt-4"
                  onSent={() => window.setTimeout(close, 2500)}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
