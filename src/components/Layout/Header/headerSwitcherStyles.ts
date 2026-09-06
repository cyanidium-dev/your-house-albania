import { cn } from '@/lib/utils'

/**
 * Shared pill styling for the language and currency switchers.
 *
 * The two sit side by side in the header and have to stay identical; they used
 * to carry the same class string copied into both files, which is exactly how a
 * pair like this drifts apart.
 *
 * Floating over a photo hero, before the bar gets its own background, the
 * dark-on-light pill is dark grey on a darkened photograph. On a phone the pair
 * read as two empty gaps next to the logo. The icons beside them already knock
 * themselves out to white there, in BOTH themes — the photo is the ground, not
 * the page — and these follow the same rule.
 */
export function headerSwitcherPillClass(overHero: boolean, sticky: boolean) {
  const onPhoto = overHero && !sticky
  return cn(
    'relative inline-flex h-8 items-center justify-between gap-1.5 rounded-full',
    'px-2.5 pr-7 sm:pr-8',
    'text-sm font-semibold',
    'cursor-pointer transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset',
    onPhoto
      ? [
          'bg-white/15 text-white border border-white/30',
          'hover:bg-white/25',
          'focus-visible:ring-white/70',
          '[text-shadow:0_1px_6px_rgba(0,0,0,0.35)]',
        ]
      : [
          'bg-dark/5 dark:bg-white/10',
          'text-dark/80 dark:text-white/80',
          'hover:bg-dark/10 dark:hover:bg-white/15',
          'focus-visible:ring-primary/40',
        ],
  )
}

/** Caret inside the pill above; follows the same ground as the label. */
export function headerSwitcherCaretClass(
  overHero: boolean,
  sticky: boolean,
  open: boolean,
) {
  const onPhoto = overHero && !sticky
  return cn(
    'absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform',
    onPhoto ? 'text-white/85' : 'text-dark/60 dark:text-white/70',
    open && 'rotate-180',
  )
}
