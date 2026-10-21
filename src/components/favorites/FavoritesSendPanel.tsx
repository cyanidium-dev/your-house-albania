'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MessengerButtons } from '@/components/contact/MessengerButtons'
import { resolveMessengers } from '@/lib/contacts/messengers'
import { messengerPriceLabel, shortlistMessengerContext } from '@/lib/contacts/messengerContext'
import type { PropertyHomes } from '@/types/propertyHomes'

type Props = {
  locale: string
  items: PropertyHomes[]
}

/**
 * "Send your shortlist to a manager" above the saved listings.
 *
 * The favourites page had no way to reach anyone. In Clarity (16-18.10.2026)
 * visitors from Germany, the segment with the best leads per click, spent most
 * of five visits on /de/favorites comparing saved listings, then left without
 * writing. WhatsApp opens with the list already typed (titles, prices,
 * addresses); Telegram opens the bot with the `favorites` placement. LeadTracker
 * records the click as a lead with that placement.
 */
export function FavoritesSendPanel({ locale, items }: Props) {
  const t = useTranslations('Favorites')
  const tQuick = useTranslations('QuickContact')
  const tMessengers = useTranslations('Messengers')
  // The addresses need the origin, which only the browser knows here.
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])

  if (!origin || items.length === 0) return null

  const context = shortlistMessengerContext((key, values) => tMessengers(key, values), {
    locale,
    items: items.map((item) => ({
      title: item.name,
      price: item.priceUnit === 'per-sqm' ? '' : messengerPriceLabel({ price: item.price, locale }),
      url: `${origin}/${locale}/property/${item.slug}`,
    })),
  })
  const messengers = resolveMessengers(undefined, locale, context)
  if (messengers.length === 0) return null

  return (
    <section
      aria-labelledby="favorites-send-title"
      data-lead-placement="favorites"
      className="mb-8 flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:p-6"
    >
      <div className="min-w-0">
        <h2 id="favorites-send-title" className="text-lg font-semibold text-dark dark:text-white md:text-xl">
          {t('sendTitle')}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-dark/70 dark:text-white/70">{t('sendBody')}</p>
      </div>
      <MessengerButtons
        messengers={messengers}
        ariaLabels={{ whatsapp: tQuick('channel.whatsapp'), telegram: tQuick('channel.telegram') }}
        className="flex w-full shrink-0 gap-2 md:w-80 [&>a]:h-11 [&>a]:text-sm"
      />
    </section>
  )
}
