import * as React from 'react'
import Link from "@/components/shared/Link";
import { Icon } from "@/components/shared/Icon";
import { cn } from '@/lib/utils'
import { brandButtonClass, type BrandButtonSize, type BrandButtonVariant } from '@/components/shared/BrandButton'

export type SectionCtaLinkProps = {
  href: string
  label: string
  variant?: BrandButtonVariant
  size?: BrandButtonSize
  className?: string
  ariaLabel?: string
  /** Append trailing arrow. Defaults to true. */
  showArrow?: boolean
}

/**
 * Shared CTA link used across landing section headers/footers: a BrandButton
 * rendered as a link, with an optional trailing arrow.
 */
export function SectionCtaLink({
  href,
  label,
  variant = 'primary',
  size = 'md',
  className,
  ariaLabel,
  showArrow = true,
}: SectionCtaLinkProps) {
  return (
    <Link
      href={href}
      className={brandButtonClass(variant, cn('group/cta w-fit max-w-full', className), size)}
      aria-label={ariaLabel ?? label}
    >
      <span className="min-w-0 text-center">{label}</span>
      {showArrow ? (
        <Icon
          icon="ph:arrow-right"
          width={18}
          height={18}
          className="shrink-0 transition-transform group-hover/cta:translate-x-0.5"
          aria-hidden
        />
      ) : null}
    </Link>
  )
}
