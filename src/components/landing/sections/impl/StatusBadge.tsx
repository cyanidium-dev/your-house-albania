import * as React from 'react'

export type TrackerStatus = 'onTrack' | 'delayed' | 'blocked' | 'done'

export function asTrackerStatus(value: unknown): TrackerStatus | null {
  return value === 'onTrack' || value === 'delayed' || value === 'blocked' || value === 'done'
    ? value
    : null
}

/** Plaque colors per status: tokens only, both themes. `done` is neutral blue. */
const BADGE_CLASS: Record<TrackerStatus, string> = {
  onTrack: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  delayed: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  blocked: 'bg-red-500/15 text-red-700 dark:text-red-400',
  done: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
}

const DOT_CLASS: Record<TrackerStatus, string> = {
  onTrack: 'bg-emerald-500',
  delayed: 'bg-amber-400',
  blocked: 'bg-red-500',
  done: 'bg-sky-500',
}

/**
 * Tracker status plaque (pill with a dot + localized label). Shares the visual
 * language of `ConfidenceDot` but reads as a status, not a data-quality hint.
 */
export function StatusBadge({ status, label }: { status: TrackerStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${BADGE_CLASS[status]}`}
    >
      <span className={`h-2 w-2 rounded-full ${DOT_CLASS[status]}`} aria-hidden />
      {label}
    </span>
  )
}
