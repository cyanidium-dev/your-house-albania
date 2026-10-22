'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { useContactModalFlag } from '@/lib/contacts/useContactModalFlag'

/**
 * "We'll send a selection by your criteria": one quiet line under the
 * listing, there from the first page, with the form in a dialog.
 *
 * It used to be a full form that appeared inside the feed after the first
 * "Show more": the page jumped to it and the cards just loaded ended up above
 * the screen (owner, 2026-10-22: "the feed jumps, the site feels buggy").
 * Rendered from the start and the same height on every page, it never moves
 * the cards. The filters ride along in `contact.message` (built on the
 * server, see lib/catalog/selectionRequest), so the operator knows what to send.
 */
export function CatalogSelectionRequest({
  locale,
  title,
  criteriaLabel,
  lead,
  cta,
  chips,
  message,
}: {
  locale: string
  title: string
  criteriaLabel: string
  lead: string
  cta: string
  chips: string[]
  message: string
}) {
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
    <section
      className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-dark/10 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      aria-labelledby="catalog-selection"
      data-lead-placement="catalog"
    >
      <p id="catalog-selection" className="text-base text-dark dark:text-white">
        <span className="text-dark/60 dark:text-white/60">{lead}</span> {title}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={brandButtonClass('primaryOutline', 'shrink-0 whitespace-nowrap', 'md')}
      >
        {cta}
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              data-lead-placement="catalog"
            >
              <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden />
              <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-dark sm:p-8">
                <button
                  type="button"
                  onClick={close}
                  aria-label={tp('contactClose')}
                  className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-dark/50 hover:text-dark dark:text-white/50 dark:hover:text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
                <h3 className="pr-8 text-xl font-medium text-dark dark:text-white">{title}</h3>
                {chips.length > 0 ? (
                  <>
                    <p className="mt-3 text-sm font-medium text-dark/60 dark:text-white/60">{criteriaLabel}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {chips.map((chip) => (
                        <li
                          key={chip}
                          className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-dark dark:text-white"
                        >
                          {chip}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <QuickLeadForm
                  locale={locale}
                  sourceLabel="catalog-selection"
                  placement="catalog"
                  withName
                  stacked
                  className="mt-5"
                  contextMessage={message}
                  onSent={() => window.setTimeout(close, 2500)}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
