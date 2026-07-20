import * as React from 'react'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { PurchaseCostItem } from '@/lib/calculators/purchaseCost'
import { CalcSectionShell } from './calculators/CalcSectionShell'
import { PurchaseCostCalcClient } from './calculators/PurchaseCostCalcClient'

type CostItemRaw = {
  _key?: string
  label?: unknown
  kind?: string
  value?: number
  capEur?: number
  note?: unknown
}

type PurchaseCostCalcSectionShape = {
  enabled?: boolean
  title?: unknown
  subtitle?: unknown
  items?: unknown[]
  disclaimer?: unknown
}

/**
 * Server wrapper: resolves localized item labels/notes, passes flat cost items
 * to the client island. Empty items or missing disclaimer → renders nothing.
 */
export function PurchaseCostCalcSection({
  locale,
  section,
}: {
  locale: string
  section: PurchaseCostCalcSectionShape
}) {
  if (section.enabled === false) return null
  const disclaimer = resolveLocalizedString(section.disclaimer as never, locale) || ''
  if (!disclaimer) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''

  const items: PurchaseCostItem[] = ((Array.isArray(section.items) ? section.items : []) as CostItemRaw[])
    .map((item) => {
      const kind = item.kind === 'percent' ? 'percent' : item.kind === 'fixed' ? 'fixed' : null
      const label = resolveLocalizedString(item.label as never, locale) || ''
      const value = Number(item.value)
      if (!kind || !label || !Number.isFinite(value) || value < 0) return null
      const note = resolveLocalizedString(item.note as never, locale) || undefined
      const capEur = Number(item.capEur)
      return {
        label,
        kind,
        value,
        ...(Number.isFinite(capEur) && capEur > 0 ? { capEur } : {}),
        ...(note ? { note } : {}),
      } satisfies PurchaseCostItem
    })
    .filter((item): item is PurchaseCostItem => item !== null)

  if (items.length === 0) return null

  return (
    <CalcSectionShell title={title} subtitle={subtitle} disclaimer={disclaimer}>
      <PurchaseCostCalcClient locale={locale} items={items} />
    </CalcSectionShell>
  )
}
