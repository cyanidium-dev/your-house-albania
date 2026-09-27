'use client'

import { Icon } from '@/components/shared/Icon'
import { cn } from '@/lib/utils'

/**
 * The round arrow that scrolls a card carousel: a 40px glass disc with a
 * hairline, the same in the top offers, the similar properties and the
 * landing collection carousels. Before 2026-09-27 the first two carried
 * identical copies of the classes and the third used the shadcn outline
 * button at 32px.
 */
export function carouselArrowClass(className?: string) {
  return cn(
    'inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full',
    'border border-dark/10 bg-white/70 text-dark shadow-sm backdrop-blur-md',
    'transition-colors duration-200 ease-out hover:bg-white',
    'dark:border-white/10 dark:bg-dark/60 dark:text-white dark:hover:bg-dark',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
    'disabled:pointer-events-none disabled:opacity-40',
    className,
  )
}

type Props = {
  direction: 'prev' | 'next'
  onClick: () => void
  /** Accessible name, e.g. "Previous", "Next". */
  label: string
  className?: string
  disabled?: boolean
}

export function CarouselArrowButton({ direction, onClick, label, className, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={carouselArrowClass(className)}
      aria-label={label}
      disabled={disabled}
    >
      <Icon
        icon={direction === 'prev' ? 'solar:alt-arrow-left-linear' : 'solar:alt-arrow-right-linear'}
        width={18}
        height={18}
        aria-hidden
      />
    </button>
  )
}
