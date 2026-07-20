import * as React from 'react'

export type DeveloperTier = 'green' | 'yellow' | 'red'

export function asDeveloperTier(value: unknown): DeveloperTier | null {
  return value === 'green' || value === 'yellow' || value === 'red' ? value : null
}

const DOT_CLASS: Record<DeveloperTier, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
}

/**
 * Developer tier indicator: colored circle + optional localized label.
 * Same visual family as `ConfidenceDot`, but tier semantics (traffic light).
 */
export function TierDot({
  tier,
  label,
  showLabel = true,
  className,
}: {
  tier: DeveloperTier
  /** Localized tier label; also used as the tooltip. */
  label: string
  showLabel?: boolean
  className?: string
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-dark/70 dark:text-white/70 ${className ?? ''}`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[tier]}`} aria-hidden />
      {showLabel ? label : null}
    </span>
  )
}
