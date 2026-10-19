'use client'

import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import { PANEL, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from '@/components/shared/layout'

/**
 * "We'll send a selection by your criteria": under the cards from page 2 on —
 * the visitor has scrolled past a full page without opening a listing. The
 * filters ride along in `contact.message` (built on the server, see
 * lib/catalog/selectionRequest), so the operator knows what to send.
 */
export function CatalogSelectionRequest({
  locale,
  title,
  criteriaLabel,
  chips,
  message,
}: {
  locale: string
  title: string
  criteriaLabel: string
  chips: string[]
  message: string
}) {
  return (
    <section
      className={`${PANEL} mt-8 p-4 sm:p-8`}
      aria-labelledby="catalog-selection"
      data-lead-placement="catalog"
    >
      <div className={`${SPLIT} items-start`}>
        <div className={SPLIT_ASIDE}>
          <h2 id="catalog-selection" className="text-2xl font-medium leading-tight tracking-tight text-dark text-balance dark:text-white">
            {title}
          </h2>
          {chips.length > 0 ? (
            <>
              <p className="mt-4 text-sm font-medium text-dark/60 dark:text-white/60">{criteriaLabel}</p>
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
        </div>
        <div className={SPLIT_MAIN}>
          <QuickLeadForm
            locale={locale}
            sourceLabel="catalog-selection"
            placement="catalog"
            withName
            stacked
            contextMessage={message}
          />
        </div>
      </div>
    </section>
  )
}
