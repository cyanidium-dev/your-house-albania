import * as React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { resolveLocaleHref } from '@/lib/routes/resolveLocaleHref'
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
  const showPrimary = Boolean(primaryLabel?.trim() && primaryHref)
  const showSecondary = Boolean(secondaryLabel?.trim() && secondaryHref)
  const showCtas = showPrimary || showSecondary

  if (!eyebrow && !title?.trim() && !description?.trim() && !showCtas) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
          {eyebrow ? (
            <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex items-center justify-center gap-2">
              <Icon icon="ph:house-simple-fill" className="text-2xl text-primary shrink-0" aria-hidden />
              <span>{eyebrow}</span>
            </p>
          ) : null}
          {title?.trim() ? (
            <h2 className="text-dark dark:text-white text-3xl sm:text-4xl md:text-5xl font-medium leading-[1.15]">
              {title}
            </h2>
          ) : null}
          {description?.trim() ? (
            <p className="text-dark/60 dark:text-white/60 text-base md:text-lg leading-relaxed whitespace-pre-line">{description}</p>
          ) : null}
          {showCtas ? (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center w-full mt-2">
              {showPrimary ? (
                <CtaButton href={primaryHref!} label={primaryLabel!} locale={locale} variant="primary" />
              ) : null}
              {showSecondary ? (
                <CtaButton href={secondaryHref!} label={secondaryLabel!} locale={locale} variant="secondary" />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
