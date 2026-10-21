import { cn } from '@/lib/utils'

/**
 * Shared styling for the header's controls.
 *
 * Hit area vs. what you see (QA 2026-10-11): the tap targets on a phone were
 * 24 to 34px — the AI and heart icons 24×24, the burger 34×34, the language
 * and currency pills 32px tall. Every control is now a 44×44 (or taller)
 * button or link, and the visible part — the icon, the pill, the burger
 * circle — sits inside it at its old size, so the bar does not get heavier.
 *
 * Floating over a photo hero, before the bar gets its own background, the
 * controls knock themselves out to white in BOTH themes: the photo is the
 * ground, not the page.
 */

/** The 44px hit area every header control gets. On phones the box hugs the
 *  visible icon and `tap-zone` keeps the 44px target, so the bar can space the
 *  icons by one even gap (the 44px boxes left 10, 20 and 14 px between them). */
export const HEADER_HIT_AREA =
  'group tap-zone relative inline-flex h-11 min-w-6 md:min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none'

/** Text/icon colour of the bare icon controls (AI, favourites, theme). */
export function headerIconColorClass(overHero: boolean, sticky: boolean) {
  const onPhoto = overHero && !sticky
  return cn(
    'transition-colors duration-300 ease-out hover:text-primary focus-visible:ring-2',
    onPhoto ? 'text-white focus-visible:ring-white/70' : 'text-dark dark:text-white focus-visible:ring-primary/50',
  )
}

/** The button around a switcher pill: the hit area, no visual of its own. */
export function headerSwitcherButtonClass() {
  return HEADER_HIT_AREA
}

/**
 * The visible pill inside the language and currency buttons. The two sit side
 * by side and have to stay identical, so both take it from here.
 */
export function headerSwitcherPillClass(overHero: boolean, sticky: boolean) {
  const onPhoto = overHero && !sticky
  return cn(
    'relative inline-flex h-8 items-center justify-between gap-1.5 rounded-full',
    'px-2.5 pr-7 sm:pr-8',
    'text-sm font-semibold',
    'transition-colors',
    'group-focus-visible:ring-2',
    onPhoto
      ? [
          'bg-white/15 text-white border border-white/30',
          'group-hover:bg-white/25',
          'group-focus-visible:ring-white/70',
          '[text-shadow:0_1px_6px_rgba(0,0,0,0.35)]',
        ]
      : [
          'bg-dark/5 dark:bg-white/10',
          'text-dark/80 dark:text-white/80',
          'group-hover:bg-dark/10 dark:group-hover:bg-white/15',
          'group-focus-visible:ring-primary/40',
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
