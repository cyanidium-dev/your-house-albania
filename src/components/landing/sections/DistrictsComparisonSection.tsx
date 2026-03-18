import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { resolveLocalizedString } from '@/lib/sanity/localized'

type District = {
  _id?: string
  title?: unknown
  slug?: string | { current?: string }
  shortDescription?: unknown
  city?: { slug?: string | { current?: string }; title?: unknown }
  heroImage?: { asset?: { url?: string }; alt?: string }
}

function slugOf(x: unknown): string {
  if (!x) return ''
  if (typeof x === 'string') return x
  return (x as { current?: string } | null | undefined)?.current ?? ''
}

export function DistrictsComparisonSection({
  locale,
  section,
}: {
  locale: string
  section: { title?: unknown; subtitle?: unknown; districts?: unknown[] }
}) {
  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''
  const districts = (Array.isArray(section.districts) ? section.districts : []) as District[]
  if (!districts.length) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {(title || subtitle) && (
          <div className="mb-10">
            {title ? (
              <h2 className="lg:text-52 text-40 font-medium dark:text-white">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="text-dark/50 dark:text-white/50 text-xm mt-2">{subtitle}</p>
            ) : null}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {districts.map((d, idx) => {
            const districtSlug = slugOf(d.slug)
            const citySlug = slugOf(d.city?.slug)
            const href =
              citySlug && districtSlug ? `/${locale}/properties/${citySlug}/${districtSlug}` : undefined
            const imgUrl = d.heroImage?.asset?.url
            const name = resolveLocalizedString(d.title as never, locale) || '—'
            const desc = resolveLocalizedString(d.shortDescription as never, locale) || ''

            const unoptimized = imgUrl?.startsWith('http') ?? false

            const Card = (
              <div className="group rounded-2xl border border-dark/10 dark:border-white/10 overflow-hidden bg-white dark:bg-dark/40 hover:shadow-3xl transition-shadow duration-200 ease-out">
                <div className="relative aspect-[16/10] bg-dark/5 dark:bg-white/5">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={d.heroImage?.alt ?? name}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1023px) 100vw, 33vw"
                      unoptimized={unoptimized}
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="font-semibold text-dark dark:text-white line-clamp-1">{name}</div>
                  {desc ? (
                    <div className="mt-2 text-sm text-dark/60 dark:text-white/60 line-clamp-2">{desc}</div>
                  ) : null}
                </div>
              </div>
            )

            if (!href) return <div key={d._id ?? idx}>{Card}</div>
            return (
              <Link key={d._id ?? idx} href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl">
                {Card}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

