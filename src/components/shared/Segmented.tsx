import { cn } from '@/lib/utils'

/**
 * The segmented control: a tinted pill track with one raised white segment.
 * Used for the deal tabs of the hero search, the Popular / New / Demand tabs
 * of the top offers, the rental-type toggle of the ROI calculator and the
 * view switcher of the catalogue. Before 2026-09-27 each of those carried its
 * own copy of the classes, and the copies had drifted (font weight, padding,
 * hover, focus ring).
 *
 * `glass` is the variant that sits on a photo (the phone search bar): the
 * track is translucent white over the picture instead of a tint of the page.
 */
export type SegmentedSize = 'sm' | 'md' | 'icon'

const TRACK =
  'inline-flex min-w-0 items-center gap-1 rounded-full p-1 bg-dark/5 dark:bg-white/10 ring-1 ring-dark/5 dark:ring-white/10'

const ITEM_BASE =
  'inline-flex min-w-0 items-center justify-center rounded-full font-semibold leading-tight cursor-pointer transition-[background-color,color,box-shadow] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset'

const ITEM_SIZE: Record<SegmentedSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  icon: 'h-8 w-8',
}

const ITEM_ACTIVE =
  'bg-white text-dark shadow-sm ring-1 ring-dark/5 dark:bg-dark dark:text-white dark:ring-white/10'
const ITEM_IDLE =
  'text-dark/70 hover:bg-dark/10 hover:text-dark dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
const ITEM_IDLE_GLASS =
  'text-dark/70 hover:bg-white/40 dark:text-white/80 dark:hover:bg-white/[0.08]'

export function segmentedTrackClass(className?: string) {
  return cn(TRACK, className)
}

export function segmentedItemClass(
  active: boolean,
  options: { size?: SegmentedSize; glass?: boolean; className?: string } = {},
) {
  const { size = 'md', glass = false, className } = options
  return cn(ITEM_BASE, ITEM_SIZE[size], active ? ITEM_ACTIVE : glass ? ITEM_IDLE_GLASS : ITEM_IDLE, className)
}
