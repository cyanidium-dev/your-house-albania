import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { LeadFormSection } from '@/components/landing/sections/LeadFormSection'
import { fetchSiteSettings } from '@/lib/sanity/client'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { resolveMessengers } from '@/lib/contacts/messengers'
import type { SocialLinkInput } from '@/lib/footer/socialChannels'
import { formatMoney } from '@/lib/currency/format'
import type { SectionHandler } from './types'

/** Budget bands offered when the section asks for a budget but lists none (EUR). */
const DEFAULT_BUDGET_STEPS = [50_000, 100_000, 200_000] as const

/** `lead-form` unless the editor set another anchor; only characters an id can carry. */
export function leadFormAnchorId(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/^#/, '') : ''
  return /^[a-z][a-z0-9-_]*$/.test(s) ? s : 'lead-form'
}

/**
 * `leadFormSection`: name, phone, optional budget and wish, posted to
 * `/api/contact-agent` as a quote with placement `landing` and the landing's
 * slug, so the Telegram message and the Sanity lead both name the landing.
 */
export const leadFormSectionHandler: SectionHandler = async ({ locale, section, landingCtx }) => {
  if (section.enabled === false) return null
  const s = section as {
    submitLabel?: unknown
    showBudget?: boolean
    budgetOptions?: unknown[]
    messengerCta?: boolean
    showMessage?: boolean
    anchorId?: unknown
  }

  let budgetOptions: string[] = []
  if (s.showBudget) {
    budgetOptions = (Array.isArray(s.budgetOptions) ? s.budgetOptions : [])
      .map((o) => resolveLocalizedString(o as never, locale).trim())
      .filter(Boolean)
    if (budgetOptions.length === 0) {
      const t = await getTranslations({ locale, namespace: 'QuickLead' })
      const money = (n: number) => formatMoney(n, 'EUR', locale)
      const [a, b, c] = DEFAULT_BUDGET_STEPS
      budgetOptions = [
        t('budgetUpTo', { amount: money(a) }),
        t('budgetRange', { from: money(a), to: money(b) }),
        t('budgetRange', { from: money(b), to: money(c) }),
        t('budgetOver', { amount: money(c) }),
      ]
    }
  }

  let messengers = null
  if (s.messengerCta) {
    const raw = await fetchSiteSettings()
    messengers = resolveMessengers((raw as { socialLinks?: SocialLinkInput[] } | null)?.socialLinks, locale)
  }

  return (
    <LeadFormSection
      key={section._key ?? 'lead-form'}
      locale={locale}
      anchorId={leadFormAnchorId(s.anchorId)}
      title={resolveLocalizedString(section.title as never, locale).trim() || undefined}
      subtitle={resolveLocalizedString(section.subtitle as never, locale).trim() || undefined}
      submitLabel={resolveLocalizedString(s.submitLabel as never, locale).trim() || undefined}
      budgetOptions={budgetOptions}
      withMessage={s.showMessage !== false}
      messengers={messengers}
      landingSlug={landingCtx?.slug}
    />
  )
}
