import * as React from 'react'
import { ZoneStatsAutoSection } from '@/components/landing/sections'
import { fetchLatestZoneMetricsByZoneId } from '@/lib/sanity/client'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

/**
 * Key figures for a zone, taken from its newest `zoneMetrics` record.
 * `zoneMode: auto` uses the landing's own linked district or city, so a
 * generated district page needs no per-page wiring.
 */
export const zoneStatsAutoSectionHandler: SectionHandler = async ({
  locale,
  section,
  linkedZone,
}) => {
  if (section.enabled === false) return null

  const explicitRef = (section.zone as { _ref?: string } | undefined)?._ref
  const zoneId = section.zoneMode === 'manual' ? explicitRef : (linkedZone?.id ?? explicitRef)
  if (!zoneId) return null

  const record = await fetchLatestZoneMetricsByZoneId(zoneId)
  if (!record) return null

  return (
    <ZoneStatsAutoSection
      key={section._key ?? 'zone-stats-auto'}
      locale={locale}
      record={record}
      titleOverride={resolveLocalizedString(section.title as never, locale) || undefined}
      metrics={section.metrics}
      showSources={section.showSources !== false}
    />
  )
}
