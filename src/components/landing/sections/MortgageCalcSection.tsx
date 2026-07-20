import * as React from 'react'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { CalcSectionShell } from './calculators/CalcSectionShell'
import { MortgageCalcClient } from './calculators/MortgageCalcClient'

type MortgageCalcSectionShape = {
  enabled?: boolean
  title?: unknown
  subtitle?: unknown
  defaultRatePct?: number
  minRatePct?: number
  maxRatePct?: number
  maxLtvPct?: number
  defaultTermYears?: number
  maxTermYears?: number
  disclaimer?: unknown
}

function num(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * Server wrapper: resolves localized fields and schema defaults, then renders
 * the interactive client island with plain props. Disclaimer is mandatory —
 * a section without one does not render.
 */
export function MortgageCalcSection({
  locale,
  section,
}: {
  locale: string
  section: MortgageCalcSectionShape
}) {
  if (section.enabled === false) return null
  const disclaimer = resolveLocalizedString(section.disclaimer as never, locale) || ''
  if (!disclaimer) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''

  const minRatePct = num(section.minRatePct, 2)
  const maxRatePct = Math.max(num(section.maxRatePct, 12), minRatePct + 0.1)
  const maxLtvPct = Math.min(100, num(section.maxLtvPct, 85))
  const maxTermYears = num(section.maxTermYears, 30)

  return (
    <CalcSectionShell title={title} subtitle={subtitle} disclaimer={disclaimer}>
      <MortgageCalcClient
        locale={locale}
        config={{
          defaultRatePct: Math.min(Math.max(num(section.defaultRatePct, 5.5), minRatePct), maxRatePct),
          minRatePct,
          maxRatePct,
          maxLtvPct,
          defaultTermYears: Math.min(num(section.defaultTermYears, 20), maxTermYears),
          maxTermYears,
        }}
      />
    </CalcSectionShell>
  )
}
