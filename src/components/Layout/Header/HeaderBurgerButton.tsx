'use client'

import type { Ref } from 'react'
import { cn } from '@/lib/utils'
import { HEADER_HIT_AREA } from './headerSwitcherStyles'

type HeaderBurgerButtonProps = {
  onClick: () => void
  overHero: boolean
  sticky: boolean
  ariaLabel: string
  expanded: boolean
  /** The drawer's id. */
  controls: string
  ref?: Ref<HTMLButtonElement>
}

/**
 * The menu button below `lg`: a 44px hit area around the same round, filled
 * button as before, so it stays the recognisable three-line burger.
 */
export default function HeaderBurgerButton({
  onClick,
  overHero,
  sticky,
  ariaLabel,
  expanded,
  controls,
  ref,
}: HeaderBurgerButtonProps) {
  const onPhoto = overHero && !sticky
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={HEADER_HIT_AREA}
      aria-label={ariaLabel}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-haspopup="dialog"
      data-header-burger=""
    >
      <span
        aria-hidden
        className={cn(
          'flex size-9 items-center justify-center rounded-full transition-colors duration-300 ease-out md:size-10',
          'group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-focus-visible:ring-primary/60 group-focus-visible:ring-offset-transparent',
          onPhoto
            ? 'bg-white text-dark group-hover:bg-white/85'
            : 'bg-dark text-white group-hover:bg-primary dark:bg-white dark:text-dark dark:group-hover:bg-primary dark:group-hover:text-white',
        )}
      >
        {/* Drawn inline so the three lines render on the first paint. */}
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
        </svg>
      </span>
    </button>
  )
}
