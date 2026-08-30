import * as React from 'react'
import Link from 'next/link'
import { resolveCta, resolveLocaleHref } from '@/lib/routes/resolveLocaleHref'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { brandButtonClass, type BrandButtonVariant } from '@/components/shared/BrandButton'

type CtaShape = {
  href?: string
  label?: unknown
}

/**
 * Mirrors `districtsComparisonSection` in the CMS. The intro copy is `description`
 * (localizedText) — an earlier version of this component read a `subtitle` field
 * that this type never defined, so 17 authored intros rendered as nothing.
 * There is likewise no `districts` field on this type; district cards belong to
 * `landingCollectionSection`.
 */
type ComparisonSection = {
  title?: unknown
  description?: unknown
  headings?: unknown[]
  rows?: Array<{ cells?: unknown[] }>
  closingText?: unknown
  cta?: CtaShape
  secondaryCta?: CtaShape
}

function resolveCell(cell: unknown, locale: string): string {
  if (cell == null) return ''
  if (typeof cell === 'string') return cell
  return resolveLocalizedString(cell as never, locale) || ''
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
  const resolved = resolveLocaleHref(href, locale)
  const v: BrandButtonVariant = variant === 'primary' ? 'primary' : 'secondary'
  const className = brandButtonClass(v)

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
  const description = resolveLocalizedString(section.description as never, locale) || ''
  const closingText = resolveLocalizedString(section.closingText as never, locale) || ''
  const primaryCta = resolveCta(resolveLocalizedString(section.cta?.label as never, locale), section.cta?.href, locale)
  const secondaryCta = resolveCta(
    resolveLocalizedString(section.secondaryCta?.label as never, locale),
    section.secondaryCta?.href,
    locale,
  )

  const headings = Array.isArray(section.headings) ? section.headings : []
  const rows = Array.isArray(section.rows) ? section.rows : []

  const hasTable = headings.length > 0 || rows.length > 0

  const showCtaRow = Boolean(primaryCta || secondaryCta)

  function renderCtas() {
    if (!closingText && !showCtaRow) return null
    return (
      <div className="mt-8 flex flex-col gap-6">
        {closingText ? (
          <p className="text-dark/75 dark:text-white/75 text-base leading-relaxed whitespace-pre-line">{closingText}</p>
        ) : null}
        {showCtaRow ? (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {primaryCta ? (
              <CtaButton href={primaryCta.href} label={primaryCta.label} locale={locale} variant="primary" />
            ) : null}
            {secondaryCta ? (
              <CtaButton href={secondaryCta.href} label={secondaryCta.label} locale={locale} variant="secondary" />
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  if (!hasTable) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {(title || description) && (
          <div className="mb-10 max-w-3xl">
            {title ? (
              <h2 className="text-3xl sm:text-4xl lg:text-52 font-medium text-dark dark:text-white leading-[1.15]">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-dark/55 dark:text-white/55 text-base sm:text-lg mt-3 whitespace-pre-line leading-relaxed">{description}</p>
            ) : null}
          </div>
        )}

        {hasTable ? (
          <div className="overflow-x-auto rounded-2xl border border-dark/10 dark:border-white/15">
            <table className="w-full border-collapse min-w-[640px] text-left">
              <thead className="bg-dark/[0.04] dark:bg-white/5">
                <tr>
                  {headings.map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 sm:px-5 py-3.5 text-dark dark:text-white font-semibold text-sm sm:text-base border-b border-dark/10 dark:border-white/15 ${
                        i === 0
                          ? 'sticky left-0 z-10 bg-dark/[0.04] dark:bg-[#1f292d] min-w-[10rem]'
                          : ''
                      }`}
                    >
                      {resolveCell(h, locale)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="odd:bg-transparent even:bg-dark/[0.02] dark:even:bg-white/[0.03]"
                  >
                    {(row.cells ?? []).map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-4 sm:px-5 py-3.5 text-dark/85 dark:text-white/85 text-sm sm:text-base border-t border-dark/5 dark:border-white/10 ${
                          ci === 0
                            ? 'sticky left-0 z-10 bg-white dark:bg-[#172023] font-medium text-dark dark:text-white'
                            : ''
                        }`}
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

      </div>
    </section>
  )
}
