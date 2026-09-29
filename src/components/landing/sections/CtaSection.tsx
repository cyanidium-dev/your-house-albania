import * as React from 'react'
import Link from 'next/link'
import { resolveCta, resolveLocaleHref } from '@/lib/routes/resolveLocaleHref'
import { Section, SECTION_LEAD, SECTION_TITLE } from '@/components/shared/layout'
import { brandButtonClass, type BrandButtonVariant } from '@/components/shared/BrandButton'

export type CtaSectionProps = {
  locale: string
  eyebrow?: string
  title?: string
  description?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

/** @deprecated Prefer `resolveLocaleHref` from `@/lib/routes/resolveLocaleHref`. */
export const resolveHref = resolveLocaleHref

function isExternalHttp(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://')
}

export function CtaButton({
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

export function CtaSection({
  locale,
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaSectionProps) {
  const primary = resolveCta(primaryLabel, primaryHref, locale)
  const secondary = resolveCta(secondaryLabel, secondaryHref, locale)
  const showCtas = Boolean(primary || secondary)

  if (!eyebrow && !title?.trim() && !description?.trim() && !showCtas) return null

  // A closing panel on the page grid: the question on the left, the actions
  // on the right. It used to be a centred column of loose text on the page
  // background, the one block on a landing that did not start at the left
  // edge. The eyebrow (the place name again, above a title that already
  // names the place) is no longer shown.
  return (
    <Section data-lead-placement="landing">
      <div className="rounded-3xl bg-primary/[0.07] ring-1 ring-primary/20 dark:bg-primary/[0.12] dark:ring-primary/25 p-6 sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="min-w-0 lg:col-span-7">
            {title?.trim() ? <h2 className={SECTION_TITLE}>{title}</h2> : null}
            {description?.trim() ? (
              <p className={`${SECTION_LEAD} ${title?.trim() ? 'mt-4' : ''}`}>{description}</p>
            ) : null}
          </div>
          {showCtas ? (
            <div className="min-w-0 lg:col-span-5 flex flex-col sm:flex-row flex-wrap gap-3 lg:justify-end">
              {primary ? (
                <CtaButton href={primary.href} label={primary.label} locale={locale} variant="primary" />
              ) : null}
              {secondary ? (
                <CtaButton href={secondary.href} label={secondary.label} locale={locale} variant="secondary" />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
