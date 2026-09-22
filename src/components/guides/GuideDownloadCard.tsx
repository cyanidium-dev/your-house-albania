import { getTranslations } from 'next-intl/server'
import type { LeadSubject } from '@/lib/analytics/leadEvents'
import { GUIDE_PRICE_INDEX_AS_OF, isGuideLocale, offersDurresGuide } from '@/lib/guides/durresGuide'
import { GuideDownloadForm } from './GuideDownloadForm'

type Props = {
  locale: string
  /** The page's city; the card renders only for Durrës. */
  citySlug: string | null | undefined
  propertySlug?: string
  subject?: LeadSubject
  /** `compact` sits inside a property page column; `section` is a depth-section block on listing pages. */
  variant?: 'section' | 'compact'
  headingClassName?: string
}

/**
 * "Get the Durrës buying guide (PDF)": the lead magnet's card. Server-rendered
 * from static strings and a fixed edition date — no headers, cookies or search
 * params — so the ISR pages it sits on stay cacheable; only the form inside is
 * a client island. Renders nothing off Durrës or in a locale without a PDF.
 */
export async function GuideDownloadCard({
  locale,
  citySlug,
  propertySlug,
  subject,
  variant = 'section',
  headingClassName,
}: Props) {
  if (!offersDurresGuide(citySlug) || !isGuideLocale(locale)) return null
  const t = await getTranslations({ locale, namespace: 'DurresGuide' })
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${GUIDE_PRICE_INDEX_AS_OF}T00:00:00Z`),
  )
  const headingId = `durres-guide-${variant}`

  return (
    <section
      aria-labelledby={headingId}
      data-lead-placement="guide"
      className={
        variant === 'compact'
          ? 'mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6'
          : 'rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-7'
      }
    >
      <div className={variant === 'compact' ? '' : 'grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-center'}>
        <div>
          <p className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            {t('badge')}
          </p>
          <h2 id={headingId} className={headingClassName ?? 'mt-2 text-lg md:text-xl font-semibold text-dark dark:text-white'}>
            {t('title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-dark/75 dark:text-white/75">{t('body', { date })}</p>
          <p className="mt-1 text-xs text-dark/50 dark:text-white/50">{t('meta')}</p>
        </div>
        <div className={variant === 'compact' ? 'mt-4' : ''}>
          <GuideDownloadForm locale={locale} propertySlug={propertySlug} subject={subject} />
        </div>
      </div>
    </section>
  )
}
