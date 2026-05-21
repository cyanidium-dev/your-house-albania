import * as React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

export type SectionCtaLinkProps = {
  href: string
  label: string
  variant?: 'primary' | 'secondary' | 'light' | 'dark' | 'onDark'
  className?: string
  ariaLabel?: string
  /** Append trailing arrow. Defaults to true. */
  showArrow?: boolean
}

/**
 * Shared CTA link used across landing section headers/footers.
 * One radius, one height, one focus ring across the whole site.
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
    'group/cta inline-flex items-center justify-center gap-2 h-11 px-8 rounded-full text-base font-semibold transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent w-fit'
  const styles: Record<NonNullable<SectionCtaLinkProps['variant']>, string> = {
    primary: 'bg-primary text-white hover:bg-dark focus-visible:ring-primary/50',
    secondary:
      'bg-transparent border border-dark/15 text-dark hover:bg-dark/5 dark:border-white/25 dark:text-white dark:hover:bg-white/10 focus-visible:ring-primary/40',
    light: 'bg-white text-dark hover:bg-primary hover:text-white focus-visible:ring-white/60',
    dark: 'bg-dark text-white hover:bg-primary focus-visible:ring-dark/50',
    onDark:
      'bg-transparent border border-white/40 text-white hover:bg-white/10 focus-visible:ring-white/60',
  }
  return (
    <Link
      href={href}
      className={cn(base, styles[variant], className)}
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
