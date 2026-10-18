/**
 * The ready WhatsApp message and the Telegram `start` payload for one place on
 * the site. Pure: the caller passes the `Messengers` translator — server
 * components `getTranslations`, client components `useTranslations`.
 */

import { formatMoney } from '@/lib/currency/format'
import { buildGeneralStartPayload, buildPropertyStartPayload } from '@/lib/telegram/startPayload'
import type { MessengerContext } from './messengers'

type TextKey = 'whatsappText.property' | 'whatsappText.propertyNoPrice' | 'whatsappText.general'

export type MessengerTranslator = (key: TextKey, values?: Record<string, string>) => string

export type MessengerProperty = {
  title: string
  /** Already formatted for the locale; empty when there is no price. */
  price?: string
  /** Absolute canonical URL in the current locale. */
  url: string
  /** `slug.current`, the listing's key. */
  slug: string
  /** Sanity `_id`, for a key too long for the payload. */
  id?: string
}

/**
 * The price as the message names it: "€120,000" / "120 000 €", a per-m² rate
 * through `perSqm` ("from €1,500 / m²"), `''` when the seller named none.
 */
export function messengerPriceLabel(input: {
  price: number | null | undefined
  priceUnit?: string | null
  locale: string
  perSqm?: (amount: string) => string
}): string {
  const p = input.price
  if (typeof p !== 'number' || !Number.isFinite(p) || p <= 0) return ''
  const amount = formatMoney(p, 'EUR', input.locale)
  return input.priceUnit === 'per-sqm' && input.perSqm ? input.perSqm(amount) : amount
}

export function messengerContext(
  t: MessengerTranslator,
  input: {
    locale: string
    /** `LeadPlacement` of the buttons, for the general payload. */
    placement: string
    property?: MessengerProperty
    /** Absolute address of the page, added to the general message when known. */
    pageUrl?: string
  },
): MessengerContext {
  const p = input.property
  if (p) {
    const title = p.title.trim() || p.slug
    const whatsappText = p.price
      ? t('whatsappText.property', { title, price: p.price, url: p.url })
      : t('whatsappText.propertyNoPrice', { title, url: p.url })
    return {
      whatsappText,
      telegramStart: buildPropertyStartPayload({ locale: input.locale, slug: p.slug, id: p.id }),
    }
  }
  const general = t('whatsappText.general')
  return {
    whatsappText: input.pageUrl ? `${general}\n${input.pageUrl}` : general,
    telegramStart: buildGeneralStartPayload({ locale: input.locale, placement: input.placement }),
  }
}
