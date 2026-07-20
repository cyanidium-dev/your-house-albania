import * as React from 'react'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { CalcSectionShell } from './calculators/CalcSectionShell'
import { RoiCalcClient, type RoiPreset } from './calculators/RoiCalcClient'

type RoiPresetRaw = {
  _key?: string
  label?: unknown
  rentalType?: string
  monthlyRentEur?: number
  adrEur?: number
  occupancyPct?: number
  seasonNightsCap?: number
  mgmtFeePct?: number
  confidence?: string
}

type RoiCalcSectionShape = {
  enabled?: boolean
  title?: unknown
  subtitle?: unknown
  presets?: unknown[]
  taxRatePct?: number
  disclaimer?: unknown
}

/**
 * Server wrapper: resolves localized preset labels and passes flat data to the
 * client island. No presets → the island opens in manual mode.
 */
export function RoiCalcSection({
  locale,
  section,
}: {
  locale: string
  section: RoiCalcSectionShape
}) {
  if (section.enabled === false) return null
  const disclaimer = resolveLocalizedString(section.disclaimer as never, locale) || ''
  if (!disclaimer) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''
  const taxRatePct = Number.isFinite(Number(section.taxRatePct))
    ? Math.min(100, Math.max(0, Number(section.taxRatePct)))
    : 15

  const presets: RoiPreset[] = ((Array.isArray(section.presets) ? section.presets : []) as RoiPresetRaw[])
    .map((p, i) => {
      const rentalType = p.rentalType === 'str' ? 'str' : p.rentalType === 'ltr' ? 'ltr' : null
      const label = resolveLocalizedString(p.label as never, locale) || ''
      if (!rentalType || !label) return null
      const preset: RoiPreset = { key: p._key ?? String(i), label, rentalType }
      if (typeof p.monthlyRentEur === 'number') preset.monthlyRentEur = p.monthlyRentEur
      if (typeof p.adrEur === 'number') preset.adrEur = p.adrEur
      if (typeof p.occupancyPct === 'number') preset.occupancyPct = p.occupancyPct
      if (typeof p.seasonNightsCap === 'number') preset.seasonNightsCap = p.seasonNightsCap
      if (typeof p.mgmtFeePct === 'number') preset.mgmtFeePct = p.mgmtFeePct
      if (typeof p.confidence === 'string') preset.confidence = p.confidence
      return preset
    })
    .filter((p): p is RoiPreset => p !== null)

  return (
    <CalcSectionShell title={title} subtitle={subtitle} disclaimer={disclaimer}>
      <RoiCalcClient locale={locale} presets={presets} taxRatePct={taxRatePct} />
    </CalcSectionShell>
  )
}
