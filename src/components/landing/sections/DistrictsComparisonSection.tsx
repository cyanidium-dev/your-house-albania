import * as React from 'react'
import Link from 'next/link'
import { resolveCta, resolveLocaleHref } from '@/lib/routes/resolveLocaleHref'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { brandButtonClass, type BrandButtonVariant } from '@/components/shared/BrandButton'
import { MEASURE, Section, SectionHeading } from '@/components/shared/layout'

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

  const heads = headings.map((h) => resolveCell(h, locale))
  const bodyRows = rows.map((row) => (row.cells ?? []).map((cell) => resolveCell(cell, locale)))

  return (
    <Section data-lead-placement="landing">
      <SectionHeading title={title || undefined} lead={description || undefined} />

      {/* Desktop: the places side by side, one column each. */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-dark/10 dark:border-white/15">
        <table className="w-full border-collapse text-left table-fixed">
          <colgroup>
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr>
              {heads.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={
                    i === 0
                      ? 'px-5 py-4 border-b border-dark/10 dark:border-white/15 bg-dark/[0.04] dark:bg-white/5'
                      : 'px-5 py-4 border-b border-dark/10 dark:border-white/15 bg-dark/[0.04] dark:bg-white/5 font-display text-xl lg:text-2xl font-medium tracking-tight text-dark dark:text-white'
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((cells, ri) => (
              <tr key={ri} className="even:bg-dark/[0.02] dark:even:bg-white/[0.03] align-top">
                {cells.map((cell, ci) =>
                  ci === 0 ? (
                    <th
                      key={ci}
                      scope="row"
                      className="px-5 py-4 border-t border-dark/5 dark:border-white/10 text-sm font-semibold text-dark/70 dark:text-white/70"
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={ci}
                      className="px-5 py-4 border-t border-dark/5 dark:border-white/10 text-[15px] leading-relaxed text-dark/85 dark:text-white/85"
                    >
                      {cell || '—'}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone: one card per question, both places inside it. The table used
          to scroll sideways with the first column pinned, so only one place
          was ever on screen — the opposite of a comparison. */}
      <div className="md:hidden flex flex-col gap-3">
        {bodyRows.map((cells, ri) => (
          <div key={ri} className="rounded-2xl border border-dark/10 dark:border-white/15 p-4">
            <p className="text-sm font-semibold text-dark/70 dark:text-white/70">{cells[0]}</p>
            <dl className="mt-3 flex flex-col gap-3">
              {cells.slice(1).map((cell, ci) => (
                <div key={ci} className={ci > 0 ? 'pt-3 border-t border-dark/10 dark:border-white/10' : undefined}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-primary">{heads[ci + 1]}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-dark/85 dark:text-white/85">{cell || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {closingText || showCtaRow ? <div className={MEASURE}>{renderCtas()}</div> : null}
    </Section>
  )
}
