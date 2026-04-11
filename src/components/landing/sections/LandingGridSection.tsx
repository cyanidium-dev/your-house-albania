import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { landingHref } from '@/lib/routes/landings'

type LocalizedString = { en?: unknown; ru?: unknown; uk?: unknown; sq?: unknown; it?: unknown }

type LandingCard = {
  _id?: string
  pageType?: string
  slug?: string
  title?: LocalizedString
  cardTitle?: LocalizedString
  cardDescription?: LocalizedString
  cardImage?: { asset?: { url?: string }; alt?: string }
  linkedCity?: { slug?: string; countrySlug?: string }
}

function resolveCardTitle(card: LandingCard, locale: string): string {
  return (
    resolveLocalizedString(card.cardTitle as never, locale) ||
    resolveLocalizedString(card.title as never, locale) ||
    '—'
  )
}

function resolveCardDescription(card: LandingCard, locale: string): string | null {
  const s = resolveLocalizedString(card.cardDescription as never, locale)
  return s?.trim() ? s : null
}

function resolveCardImageUrl(card: LandingCard): string | null {
  return card.cardImage?.asset?.url ?? null
}

export function LandingGridSection({
  locale,
  section,
}: {
  locale: string
  section: {
    enabled?: boolean
    title?: unknown
    subtitle?: unknown
    cta?: { href?: string; label?: unknown }
    sourceMode?: 'manual' | 'auto' | string
    landings?: unknown[]
  }
}) {
  if (section.enabled === false) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''

  const cards = (Array.isArray(section.landings) ? section.landings : []) as LandingCard[]
  if (!cards.length) return null

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {(title || subtitle) && (
          <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              {title ? (
                <h2 className="lg:text-52 text-40 font-medium dark:text-white">{title}</h2>
              ) : null}
              {subtitle ? (
                <p className="text-dark/50 dark:text-white/50 text-xm mt-2 whitespace-pre-line">{subtitle}</p>
              ) : null}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((c, idx) => {
            const cardTitle = resolveCardTitle(c, locale)
            const cardDescription = resolveCardDescription(c, locale)
            const imgUrl = resolveCardImageUrl(c)
            const linkedCitySlug = c.linkedCity?.slug ?? null
            const href = landingHref({
              locale,
              pageType: c.pageType ?? null,
              slug: c.slug ?? null,
              linkedCitySlug,
              linkedCityCountrySlug: c.linkedCity?.countrySlug ?? null,
            })
            const unoptimized = imgUrl?.startsWith('http') ?? false

            return (
              <Link
                key={c._id ?? idx}
                href={href}
                className="group block rounded-2xl border border-dark/10 dark:border-white/10 overflow-hidden bg-white dark:bg-dark/40 hover:shadow-3xl transition-shadow duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="relative aspect-[16/10] bg-dark/5 dark:bg-white/5">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={c.cardImage?.alt ?? cardTitle}
                      fill
                      className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      sizes="(max-width: 1023px) 100vw, 33vw"
                      unoptimized={unoptimized}
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="font-semibold text-dark dark:text-white line-clamp-1">
                    {cardTitle}
                  </div>
                  {cardDescription ? (
                    <div className="mt-2 text-sm text-dark/60 dark:text-white/60 line-clamp-2 whitespace-pre-line">
                      {cardDescription}
                    </div>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

