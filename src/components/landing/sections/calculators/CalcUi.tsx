'use client'

import * as React from 'react'
import * as Slider from '@radix-ui/react-slider'
import { TriangleAlert } from 'lucide-react'
import { PriceText } from '@/components/shared/PriceText'

/** Percent formatting: localized separator, up to `digits` fraction digits. */
export function formatPct(value: number, locale: string, digits = 1): string {
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)}%`
}

/**
 * Two-column calculator layout: inputs left, results right in a sticky panel
 * on md+ so the key figures stay visible while scrolling the breakdown.
 * Mobile (one column): results render directly under the inputs — the forms
 * are short, so the result card lands in the first viewport without extra
 * sticky chrome overlapping the disclaimer.
 */
export function CalcLayout({
  inputs,
  results,
}: {
  inputs: React.ReactNode
  results: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10 items-start">
      <div className="flex flex-col gap-4 min-w-0">{inputs}</div>
      <div className="md:sticky md:top-24 min-w-0">{results}</div>
    </div>
  )
}

/** Results panel: subtle tinted card in the data-block style. */
export function CalcResultsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-dark/[0.03] ring-1 ring-dark/[0.06] dark:bg-white/[0.05] dark:ring-white/10 p-5 sm:p-6 flex flex-col gap-5">
      {children}
    </div>
  )
}

const thumbClass =
  // `after` pseudo-element extends the touch target to ~44px without growing the visual dot.
  "relative block size-5 cursor-pointer rounded-full border-2 border-white bg-primary shadow transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 after:absolute after:-inset-3 after:content-['']"

/**
 * Single-thumb slider field with a label row and formatted value display —
 * same track/thumb pattern as the catalog `RangeField`.
 */
export function CalcSliderField({
  label,
  valueDisplay,
  min,
  max,
  step,
  value,
  onValueChange,
}: {
  label: string
  valueDisplay: string
  min: number
  max: number
  step: number
  value: number
  onValueChange: (next: number) => void
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-xs text-dark/70 dark:text-white/80">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="shrink-0 tabular-nums">{valueDisplay}</span>
      </div>
      <div className="flex h-11 items-center rounded-xl border border-dark/10 px-3 dark:border-white/10">
        <Slider.Root
          className="relative flex h-6 w-full touch-none select-none items-center"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(values) => onValueChange(values[0] ?? min)}
        >
          <Slider.Track className="relative h-1 grow rounded-full bg-dark/10 dark:bg-white/20">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb aria-label={label} className={thumbClass} />
        </Slider.Root>
      </div>
    </div>
  )
}

/**
 * Numeric input styled like the project contact-form inputs.
 * Shows a localized thousands-separated value when blurred; raw digits while
 * editing. `inputMode="numeric"` for the mobile keypad.
 */
export function CalcNumberInput({
  label,
  value,
  onChange,
  locale,
  min,
  max,
  suffix,
}: {
  label: string
  /** Empty string allowed (user cleared the field). */
  value: number | ''
  onChange: (next: number | '') => void
  locale: string
  min?: number
  max?: number
  suffix?: string
}) {
  const [focused, setFocused] = React.useState(false)
  const display =
    value === ''
      ? ''
      : focused
        ? String(value)
        : new Intl.NumberFormat(locale).format(value)

  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-dark/70 dark:text-white/80">{label}</span>
      <span className="relative block">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            if (value === '') return
            let clamped = value
            if (typeof min === 'number') clamped = Math.max(min, clamped)
            if (typeof max === 'number') clamped = Math.min(max, clamped)
            if (clamped !== value) onChange(clamped)
          }}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, '')
            if (digits === '') return onChange('')
            const n = Number(digits)
            if (Number.isFinite(n)) onChange(n)
          }}
          className="h-11 w-full rounded-full border border-black/10 px-5 text-sm outline-primary focus:outline dark:border-white/10 bg-transparent text-dark dark:text-white tabular-nums"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-dark/40 dark:text-white/40">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  )
}

/**
 * Result figure. `primary` = the one hero number of the calculator; the rest
 * render smaller. `animateKey` re-triggers a subtle enter animation on change
 * (tailwindcss-animate utilities, no extra libraries).
 */
export function CalcResultStat({
  value,
  label,
  primary,
  animateKey,
}: {
  value: React.ReactNode
  label: string
  primary?: boolean
  animateKey?: string | number
}) {
  return (
    <div className="min-w-0">
      <div
        className={
          primary
            ? 'text-4xl sm:text-5xl font-medium tracking-tight text-dark dark:text-white leading-none'
            : 'text-xl sm:text-2xl font-medium tracking-tight text-dark dark:text-white'
        }
      >
        <span
          key={animateKey}
          className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          {value}
        </span>
      </div>
      <div
        className={
          'font-medium text-dark/60 dark:text-white/60 ' +
          (primary ? 'mt-2 text-sm sm:text-base' : 'mt-1 text-xs sm:text-sm')
        }
      >
        {label}
      </div>
    </div>
  )
}

/** Money output in the user-selected display currency (base amounts are EUR). */
export function CalcMoney({ amountEur, locale }: { amountEur: number; locale: string }) {
  return <PriceText amountEur={amountEur} locale={locale} />
}

/** LTV / validity notice: calm ok-state, amber (not red) warning with an icon. */
export function CalcNotice({
  tone,
  children,
}: {
  tone: 'ok' | 'warn'
  children: React.ReactNode
}) {
  if (tone === 'warn') {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{children}</span>
      </p>
    )
  }
  return <p className="text-sm text-dark/50 dark:text-white/50">{children}</p>
}

/** Small amber chip (e.g. "capped" on percent items that hit their ceiling). */
export function CalcChip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400"
    >
      {children}
    </span>
  )
}

/** Zebra breakdown row: label left, tabular sum right-aligned. */
export function CalcBreakdownRow({
  label,
  strong,
  children,
}: {
  label: React.ReactNode
  strong?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 odd:bg-dark/[0.03] dark:odd:bg-white/[0.04]">
      <dt
        className={
          'flex min-w-0 items-center gap-1.5 ' +
          (strong ? 'font-semibold text-dark dark:text-white' : 'text-dark/60 dark:text-white/60')
        }
      >
        {label}
      </dt>
      <dd
        className={
          'shrink-0 tabular-nums text-right ' +
          (strong ? 'font-semibold text-dark dark:text-white' : 'text-dark/80 dark:text-white/80')
        }
      >
        {children}
      </dd>
    </div>
  )
}

/** Placeholder shown while no valid price is entered. */
export function CalcEmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-dark/15 dark:border-white/15 px-5 py-6 text-center text-sm text-dark/50 dark:text-white/50">
      {text}
    </p>
  )
}
