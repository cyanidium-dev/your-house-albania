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
  heroImage?: { asset?: { url?: string }; alt?: string; label?: string }
}

type CtaShape = {
  href?: string
  label?: unknown
}

type ComparisonSection = {
  title?: unknown
  subtitle?: unknown
  districts?: unknown[]
  headings?: unknown[]
  rows?: Array<{ cells?: unknown[] }>
  closingText?: unknown
  cta?: CtaShape
  secondaryCta?: CtaShape
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

function resolveHref(href: string, locale: string): string {
  if (!href) return '#'
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href
  }
  if (href.startsWith('#')) {
    return href
  }
  if (href.startsWith('/')) {
    return `/${locale}${href}`
  }
  return `/${locale}/${href}`
}

function isExternalHttp(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://')
}

function CtaButton({
  href,
  label,
  locale,
  variant,
}: {
  href: string
  label: string
  locale: string
  variant: 'primary' | 'secondary'
}) {
  const resolved = resolveHref(href, locale)
  const primaryClass =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
  const secondaryClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-dark/15 bg-transparent px-6 py-3 text-base font-medium text-dark hover:bg-dark/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
  const className = variant === 'primary' ? primaryClass : secondaryClass

  if (isExternalHttp(resolved)) {
    return (
      <a href={resolved} className={className} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    )
  }
  if (resolved.startsWith('mailto:') || resolved.startsWith('tel:') || resolved.startsWith('#')) {
    return (
      <a href={resolved} className={className}>
        {label}
      </a>
    )
  }
  return (
    <Link href={resolved} className={className}>
      {label}
    </Link>
  )
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
  const secondaryLabel = resolveLocalizedString(section.secondaryCta?.label as never, locale) || ''
  const secondaryHref = section.secondaryCta?.href

  const headings = Array.isArray(section.headings) ? section.headings : []
  const rows = Array.isArray(section.rows) ? section.rows : []
  const districts = (Array.isArray(section.districts) ? section.districts : []) as District[]

  const hasTable = headings.length > 0 || rows.length > 0
  const hasDistricts = districts.length > 0

  const showPrimary = Boolean(ctaLabel && ctaHref)
  const showSecondary = Boolean(secondaryLabel && secondaryHref)
  const showCtaRow = showPrimary || showSecondary

  function renderCtas() {
    if (!closingText && !showCtaRow) return null
    return (
      <div className="mt-8 flex flex-col gap-6">
        {closingText ? (
          <p className="text-dark/75 dark:text-white/75 text-base leading-relaxed whitespace-pre-line">{closingText}</p>
        ) : null}
        {showCtaRow ? (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {showPrimary ? (
              <CtaButton href={ctaHref!} label={ctaLabel} locale={locale} variant="primary" />
            ) : null}
            {showSecondary ? (
              <CtaButton href={secondaryHref!} label={secondaryLabel} locale={locale} variant="secondary" />
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

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
              <p className="text-dark/50 dark:text-white/50 text-xm mt-2 whitespace-pre-line">{subtitle}</p>
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

        {hasTable ? renderCtas() : null}

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

        {hasDistricts && !hasTable ? renderCtas() : null}
      </div>
    </section>
  )
}
