import { getTranslations } from 'next-intl/server'
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import type { LeadSubject } from '@/lib/analytics/leadEvents'

/**
 * "Ask about this listing": one question and a phone number (or a messenger
 * under the form), right after the price comparison — the point where the
 * visitor has just read how the price sits against the district. The server
 * records it as a property inquiry for this listing (contact.message holds the
 * question) and routes it to the listing's agent.
 */
export async function AskAboutListing({
  locale,
  propertySlug,
  propertyTitle,
  subject,
}: {
  locale: string
  propertySlug: string
  propertyTitle: string
  subject: LeadSubject
}) {
  const t = await getTranslations({ locale, namespace: 'Capture.ask' })
  return (
    <section
      id="ask-about-listing"
      className="py-8 mt-8 border-t border-dark/5 dark:border-white/15 scroll-mt-28"
      data-lead-placement="property"
      data-property-slug={propertySlug}
    >
      <h3 className="text-xl font-medium">{t('title')}</h3>
      <QuickLeadForm
        locale={locale}
        sourceLabel={`ask:${propertySlug}`}
        placement="property"
        withMessage
        stacked
        messagePlaceholder={t('placeholder')}
        messageRequiredError={t('required')}
        submitLabel={t('submit')}
        propertySlug={propertySlug}
        propertyTitle={propertyTitle}
        subject={subject}
        className="mt-5"
      />
    </section>
  )
}
