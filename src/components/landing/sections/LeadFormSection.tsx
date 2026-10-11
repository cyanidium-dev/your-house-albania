import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import { MessengerButtons } from '@/components/contact/MessengerButtons'
import { PANEL, Section, SECTION_LEAD, SECTION_TITLE, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from '@/components/shared/layout'
import type { MessengerLink } from '@/lib/contacts/messengers'
import { cn } from '@/lib/utils'

export type LeadFormSectionProps = {
  locale: string
  anchorId: string
  title?: string
  subtitle?: string
  submitLabel?: string
  budgetOptions: string[]
  withMessage: boolean
  /** Messenger buttons beside the form (and not repeated under it). */
  messengers: MessengerLink[] | null
  landingSlug?: string
}

/**
 * A landing's lead form: heading and the messenger buttons on the narrow side
 * of the split, the form in a panel on the wide side. The anchor lets a hero
 * button ("Leave your budget") scroll straight to it.
 */
export async function LeadFormSection({
  locale,
  anchorId,
  title,
  subtitle,
  submitLabel,
  budgetOptions,
  withMessage,
  messengers,
  landingSlug,
}: LeadFormSectionProps) {
  const [t, tContact] = await Promise.all([
    getTranslations({ locale, namespace: 'QuickLead' }),
    getTranslations({ locale, namespace: 'QuickContact' }),
  ])
  const headingId = `${anchorId}-title`
  return (
    <Section id={anchorId} className="scroll-mt-24" aria-labelledby={headingId} data-lead-placement="landing">
      <div className={SPLIT}>
        <div className={SPLIT_ASIDE}>
          <h2 id={headingId} className={SECTION_TITLE}>
            {title || t('heading')}
          </h2>
          <p className={cn(SECTION_LEAD, 'mt-3')}>{subtitle || t('body')}</p>
          {messengers && messengers.length ? (
            <div className="mt-8">
              <p className="text-sm font-medium text-dark/60 dark:text-white/60">{tContact('orWrite')}</p>
              <MessengerButtons
                messengers={messengers}
                ariaLabels={{ whatsapp: tContact('channel.whatsapp'), telegram: tContact('channel.telegram') }}
                className="mt-3 flex flex-col gap-2 sm:flex-row"
              />
            </div>
          ) : null}
        </div>
        <div className={SPLIT_MAIN}>
          <div className={cn(PANEL, 'p-6 sm:p-8')}>
            <QuickLeadForm
              locale={locale}
              sourceLabel={landingSlug ? `Landing: ${landingSlug}` : 'Landing'}
              placement="landing"
              landingSlug={landingSlug}
              withName
              stacked
              withMessage={withMessage}
              budgetOptions={budgetOptions}
              submitLabel={submitLabel}
              showMessengers={!messengers}
            />
          </div>
        </div>
      </div>
    </Section>
  )
}
