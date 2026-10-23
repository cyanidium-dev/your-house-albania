'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'
import PropertyCard from '@/components/shared/property/PropertyCard'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { track } from '@/lib/analytics/track'
import { MESSENGER_ICON, MESSENGER_NAME, resolveMessengers } from '@/lib/contacts/messengers'
import type { PropertyHomes } from '@/types/propertyHomes'

export type WelcomeBackData = {
  picks: PropertyHomes[]
  fresh: PropertyHomes[]
  freshCount: number
  criteria?: { cityLabel?: string; minBedrooms?: number; maxBedrooms?: number; maxPrice?: number }
}

type Props = { data: WelcomeBackData; locale: string; onClose: () => void }

/** "Durrës, 2+1, up to €130,000" from what the visitor looked at. */
function useSummary(criteria: WelcomeBackData['criteria'], locale: string): string {
  const t = useTranslations('WelcomeBack')
  if (!criteria) return ''
  const rooms = (n: number) => (n === 0 ? t('studio') : `${n}+1`)
  // The city as a bare name, first: "in {city}" needs a grammatical case
  // the card label does not have (ru "в Дурресе", not "в Дуррес").
  const parts: string[] = criteria.cityLabel ? [criteria.cityLabel] : []
  if (criteria.minBedrooms !== undefined && criteria.maxBedrooms !== undefined) {
    parts.push(
      criteria.minBedrooms === criteria.maxBedrooms
        ? rooms(criteria.minBedrooms)
        : `${rooms(criteria.minBedrooms)} - ${rooms(criteria.maxBedrooms)}`,
    )
  }
  if (criteria.maxPrice) {
    const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
      Math.round(criteria.maxPrice / 5000) * 5000,
    )
    parts.push(t('upTo', { price }))
  }
  return parts.join(', ')
}

function CardGrid({ items, locale, section }: { items: PropertyHomes[]; locale: string; section: 'fresh' | 'picks' }) {
  return (
    // A swipeable row on a phone, so the realtor block below is a short scroll
    // away; a grid from `sm`.
    <div className="-mx-5 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.slug}
          className="w-[80%] min-w-0 shrink-0 snap-start sm:w-auto"
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest('a[href*="/property/"]')) {
              track({ event: 'welcome_back_card_click', slug: item.slug ?? '', section })
            }
          }}
        >
          <PropertyCard item={item} locale={locale} />
        </div>
      ))}
    </div>
  )
}

/**
 * The picks for a returning visitor (E005): new listings since the last visit,
 * listings like the ones they viewed, and a way to ask a realtor for more.
 * A native modal dialog: full screen on a phone, a centred panel from `md`.
 */
export default function WelcomeBackFeed({ data, locale, onClose }: Props) {
  const t = useTranslations('WelcomeBack')
  const ref = useRef<HTMLDialogElement>(null)
  const summary = useSummary(data.criteria, locale)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const close = useCallback(() => {
    track({ event: 'welcome_back_dismiss', stage: 'feed' })
    if (ref.current?.open) ref.current.close()
    onCloseRef.current()
  }, [])

  const attach = useCallback(
    (el: HTMLDialogElement | null) => {
      ref.current = el
      if (!el) return
      el.addEventListener('cancel', (e) => {
        e.preventDefault()
        close()
      })
      if (!el.open) el.showModal()
    },
    [close],
  )

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])

  // The realtor gets the visitor's criteria in the WhatsApp message; Telegram
  // cannot pre-fill a chat with a person, so it opens the chat as it is.
  const messengers = resolveMessengers(undefined, locale, {
    whatsappText: t('realtorMessage', { summary: summary || t('summaryFallback') }),
  })

  return (
    <dialog
      ref={attach}
      aria-labelledby="welcome-back-feed-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 bg-white p-0 text-dark backdrop:bg-black/60 dark:bg-dark dark:text-white md:m-auto md:h-fit md:max-h-[90dvh] md:max-w-5xl md:rounded-3xl md:shadow-2xl"
    >
      <div className="px-5 pt-5 md:px-8 md:pt-7" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="welcome-back-feed-title" className="text-2xl font-semibold leading-tight">
              {t('feedTitle')}
            </h2>
            {summary ? <p className="mt-1 text-sm text-dark/70 dark:text-white/70">{t('feedLead', { summary })}</p> : null}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t('close')}
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-dark/50 transition-colors hover:bg-dark/5 hover:text-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon icon="ph:x" width={22} height={22} aria-hidden />
          </button>
        </div>

        {data.fresh.length > 0 ? (
          <section className="mt-6" aria-labelledby="welcome-back-fresh">
            <h3 id="welcome-back-fresh" className="text-lg font-semibold">
              {t('freshTitle', { count: data.freshCount })}
            </h3>
            <CardGrid items={data.fresh} locale={locale} section="fresh" />
          </section>
        ) : null}

        {data.picks.length > 0 ? (
          <section className="mt-8" aria-labelledby="welcome-back-picks">
            <h3 id="welcome-back-picks" className="text-lg font-semibold">
              {t('picksTitle')}
            </h3>
            <CardGrid items={data.picks} locale={locale} section="picks" />
          </section>
        ) : null}

        <section
          className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 dark:border-primary/30 dark:bg-primary/10"
          aria-labelledby="welcome-back-realtor"
          data-lead-placement="page"
        >
          <h3 id="welcome-back-realtor" className="text-lg font-semibold">
            {t('realtorTitle')}
          </h3>
          <p className="mt-1 text-sm text-dark/70 dark:text-white/70">{t('realtorText')}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {messengers.map((m, i) => (
              <a
                key={m.key}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track({ event: 'welcome_back_realtor', messenger: m.key })}
                className={brandButtonClass(i === 0 ? 'primary' : 'secondary', 'sm:flex-1', 'md')}
              >
                <Icon icon={MESSENGER_ICON[m.key]} width={20} height={20} aria-hidden />
                {MESSENGER_NAME[m.key]}
              </a>
            ))}
          </div>
        </section>
      </div>
    </dialog>
  )
}
