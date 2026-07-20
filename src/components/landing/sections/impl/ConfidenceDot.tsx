import * as React from 'react'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export function asConfidenceLevel(value: unknown): ConfidenceLevel | null {
  return value === 'high' || value === 'medium' || value === 'low' ? value : null
}

const DOT_CLASS: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-400',
  low: 'bg-red-500',
}

/**
 * Small colored confidence dot (🟢/🟡/🔴 convention of the research base).
 * `label` is the localized tooltip text, resolved by the caller via next-intl.
 */
export function ConfidenceDot({
  level,
  label,
  className,
}: {
  level: ConfidenceLevel
  label: string
  className?: string
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center ${className ?? ''}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${DOT_CLASS[level]}`} aria-hidden />
    </span>
  )
}
