import * as React from 'react'
import Link from "@/components/shared/Link";
import { cn } from '@/lib/utils'

/**
 * The one button of the site.
 *
 * Every call to action is a pill built from these three lists: a variant for
 * the ground it sits on, a size, and whatever layout the call site needs
 * (`w-full`, margins). Before 2026-09-27 the same green pill was written by
 * hand in about 45 places, in nine heights and four hover colours; see
 * docs/ux/IA-AUDIT-2026-09-26.md §4.
 *
 * Variants, by ground:
 * - `primary`: green, the default action on a light or dark page.
 * - `secondary`: hairline outline in the page colour, the quieter action.
 * - `ghost`: text only, for a third action next to the two above.
 * - `primaryOutline`: green hairline with a green tint; fills on hover. The
 *   card action, where a solid green pill would out-shout the price.
 * - `light`: white, for photo heroes and the dark bands; turns green on hover.
 * - `onDark`: white hairline for the second action on photos and dark bands.
 * - `dark`: charcoal pill; turns green on hover.
 *
 * Sizes: `sm` 36px for inline and card actions, `md` 44px (the default),
 * `lg` 48px for the one action a whole section is about. Heights are minimums
 * and the label may wrap: the longer locales (uk, ru, pl) overflow a 390px
 * phone otherwise.
 */
export type BrandButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'primaryOutline'
  | 'light'
  | 'onDark'
  | 'dark'

export type BrandButtonSize = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold text-center leading-tight whitespace-normal transition-colors duration-200 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:pointer-events-none'

export const BRAND_BUTTON_SIZES: Record<BrandButtonSize, string> = {
  sm: 'min-h-9 px-4 py-1.5 text-sm',
  md: 'min-h-11 px-6 py-2.5 text-base sm:px-8',
  lg: 'min-h-12 px-8 py-3 text-base',
}

export const BRAND_BUTTON_STYLES: Record<BrandButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-dark dark:hover:bg-white dark:hover:text-dark focus-visible:ring-primary/50',
  secondary:
    'bg-transparent border border-dark/15 text-dark hover:border-primary hover:text-primary dark:border-white/25 dark:text-white dark:hover:border-primary dark:hover:text-primary focus-visible:ring-primary/40',
  ghost:
    'bg-transparent text-dark/70 hover:text-primary dark:text-white/75 dark:hover:text-primary focus-visible:ring-primary/40',
  primaryOutline:
    'border border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary hover:text-white focus-visible:ring-primary/40',
  light: 'bg-white text-dark hover:bg-primary hover:text-white focus-visible:ring-white/60',
  onDark:
    'bg-transparent border border-white/40 text-white hover:border-white hover:bg-white/10 focus-visible:ring-white/60',
  dark: 'bg-dark text-white hover:bg-primary dark:bg-white dark:text-dark dark:hover:bg-primary dark:hover:text-white focus-visible:ring-dark/50',
}

export function brandButtonClass(
  variant: BrandButtonVariant = 'primary',
  className?: string,
  size: BrandButtonSize = 'md',
) {
  return cn(BASE, BRAND_BUTTON_SIZES[size], BRAND_BUTTON_STYLES[variant], className)
}

type CommonProps = {
  variant?: BrandButtonVariant
  size?: BrandButtonSize
  className?: string
  children: React.ReactNode
}

type AsButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    as?: 'button'
  }

type AsLinkProps = CommonProps & {
  as: 'link'
  href: string
  ariaLabel?: string
  target?: string
  rel?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

type AsAnchorProps = CommonProps & {
  as: 'a'
  href: string
  ariaLabel?: string
  target?: string
  rel?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

export type BrandButtonProps = AsButtonProps | AsLinkProps | AsAnchorProps

export function BrandButton(props: BrandButtonProps) {
  const { variant = 'primary', size = 'md', className, children } = props
  const cls = brandButtonClass(variant, className, size)

  if ('as' in props && props.as === 'link') {
    return (
      <Link
        href={props.href}
        className={cls}
        aria-label={props.ariaLabel}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
      >
        {children}
      </Link>
    )
  }
  if ('as' in props && props.as === 'a') {
    return (
      <a
        href={props.href}
        className={cls}
        aria-label={props.ariaLabel}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
      >
        {children}
      </a>
    )
  }
  const { as: _as, variant: _v, size: _s, className: _c, children: _ch, type, ...rest } = props as AsButtonProps
  return (
    <button type={type ?? 'button'} className={cls} {...rest}>
      {children}
    </button>
  )
}
