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

type ComparisonSection = {
  title?: unknown
  subtitle?: unknown
  districts?: unknown[]
  headings?: unknown[]
  rows?: Array<{ cells?: unknown[] }>
  closingText?: unknown
  cta?: { href?: string; label?: unknown }
}

function slugOf(x: unknown): string {
  if (!x) return ''
  if (typeof x === 'string') return x
  return (x as { current?: string } | null | undefined)?.current ?? ''
}

function resolveCell(cell: unknown, locale: string): string {
  if (cell == null) return ''
  if (typeof cell === 'string') return cell
  return resolveLocalizedString(cell as never, locale) || ''
}

export function DistrictsComparisonSection({
  locale,
  section,
}: {
  locale: string
  section: ComparisonSection
}) {
  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''
  const closingText = resolveLocalizedString(section.closingText as never, locale) || ''
  const ctaLabel = resolveLocalizedString(section.cta?.label as never, locale) || ''
  const ctaHref = section.cta?.href

  const headings = Array.isArray(section.headings) ? section.headings : []
  const rows = Array.isArray(section.rows) ? section.rows : []
  const districts = (Array.isArray(section.districts) ? section.districts : []) as District[]

  const hasTable = headings.length > 0 || rows.length > 0
  const hasDistricts = districts.length > 0

  if (!hasTable && !hasDistricts) return null

  return (
    <section className="py-12 md:py-16">
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

        {hasTable ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-dark/10 dark:border-white/20 min-w-[400px]">
              <thead>
                <tr>
                  {headings.map((h, i) => (
                    <th
                      key={i}
                      className="border border-dark/10 dark:border-white/20 px-4 py-3 text-left text-dark dark:text-white font-medium"
                    >
                      {resolveCell(h, locale)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {(row.cells ?? []).map((cell, ci) => (
                      <td
                        key={ci}
                        className="border border-dark/10 dark:border-white/20 px-4 py-3 text-dark/80 dark:text-white/80 text-sm"
                      >
                        {resolveCell(cell, locale)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {hasTable && (closingText || (ctaLabel && ctaHref)) && (
          <div className="mt-8 flex flex-col gap-6">
            {closingText ? (
              <p className="text-dark/75 dark:text-white/75 text-base leading-relaxed">{closingText}</p>
            ) : null}
            {ctaLabel && ctaHref ? (
              <Link
                href={ctaHref.startsWith('/') ? `/${locale}${ctaHref}` : `/${locale}/${ctaHref}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary/90 transition-colors w-fit"
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        )}

        {!hasTable && hasDistricts ? (
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
        ) : null}

        {hasDistricts && !hasTable && (closingText || (ctaLabel && ctaHref)) && (
          <div className="mt-8 flex flex-col gap-6">
            {closingText ? (
              <p className="text-dark/75 dark:text-white/75 text-base leading-relaxed">{closingText}</p>
            ) : null}
            {ctaLabel && ctaHref ? (
              <Link
                href={ctaHref.startsWith('/') ? `/${locale}${ctaHref}` : `/${locale}/${ctaHref}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary/90 transition-colors w-fit"
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
