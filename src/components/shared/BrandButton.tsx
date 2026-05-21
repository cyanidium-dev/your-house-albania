import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type BrandButtonVariant = 'primary' | 'secondary' | 'light' | 'dark' | 'onDark'

const BASE =
  'inline-flex items-center justify-center gap-2 h-11 px-8 rounded-full text-base font-semibold transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:pointer-events-none'

export const BRAND_BUTTON_STYLES: Record<BrandButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-dark focus-visible:ring-primary/50',
  secondary:
    'bg-transparent border border-dark/15 text-dark hover:bg-dark/5 dark:border-white/25 dark:text-white dark:hover:bg-white/10 focus-visible:ring-primary/40',
  light: 'bg-white text-dark hover:bg-primary hover:text-white focus-visible:ring-white/60',
  dark: 'bg-dark text-white hover:bg-primary focus-visible:ring-dark/50',
  onDark:
    'bg-transparent border border-white/40 text-white hover:bg-white/10 focus-visible:ring-white/60',
}

export function brandButtonClass(variant: BrandButtonVariant = 'primary', className?: string) {
  return cn(BASE, BRAND_BUTTON_STYLES[variant], className)
}

type CommonProps = {
  variant?: BrandButtonVariant
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
}

type AsAnchorProps = CommonProps & {
  as: 'a'
  href: string
  ariaLabel?: string
  target?: string
  rel?: string
}

export type BrandButtonProps = AsButtonProps | AsLinkProps | AsAnchorProps

export function BrandButton(props: BrandButtonProps) {
  const { variant = 'primary', className, children } = props
  const cls = brandButtonClass(variant, className)

  if ('as' in props && props.as === 'link') {
    return (
      <Link
        href={props.href}
        className={cls}
        aria-label={props.ariaLabel}
        target={props.target}
        rel={props.rel}
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
      >
        {children}
      </a>
    )
  }
  const { as: _as, variant: _v, className: _c, children: _ch, ...rest } = props as AsButtonProps
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}
