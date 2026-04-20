import * as React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

export type SectionCtaLinkProps = {
  href: string
  label: string
  variant?: 'primary' | 'light' | 'dark'
  className?: string
  ariaLabel?: string
  /** Append trailing arrow. Defaults to true. */
  showArrow?: boolean
}

/**
 * Shared CTA link used across landing section headers/footers.
 * Normalizes padding, radius, hover, and focus-visible ring
 * so every section has a consistent affordance.
 */
export function SectionCtaLink({
  href,
  label,
  variant = 'primary',
  className,
  ariaLabel,
  showArrow = true,
}: SectionCtaLinkProps) {
  const base =
    'inline-flex items-center gap-2 py-4 px-8 rounded-full text-base font-semibold duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
  const styles: Record<NonNullable<SectionCtaLinkProps['variant']>, string> = {
    primary: 'bg-primary text-white hover:bg-dark focus-visible:ring-primary/50',
    light: 'bg-white text-dark hover:bg-primary hover:text-white focus-visible:ring-white/60',
    dark: 'bg-dark text-white hover:bg-primary focus-visible:ring-dark/50',
  }
  return (
    <Link
      href={href}
      className={cn(base, styles[variant], 'w-fit', className)}
      aria-label={ariaLabel ?? label}
    >
      <span className="truncate">{label}</span>
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
