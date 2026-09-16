import * as React from 'react'
import { ZonePriceTableAutoSection } from '@/components/landing/sections'
import { ListingPriceIndexSection } from '@/components/landing/sections/ListingPriceIndexSection'
import {
  fetchLatestZoneMetricsForCityDistricts,
  fetchLatestZoneMetricsByZoneIds,
} from '@/lib/sanity/client'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { ZoneTableSort } from '@/components/landing/sections/ZonePriceTableAutoSection'
import type { SectionHandler } from './types'

const SORTS: ZoneTableSort[] = ['price', 'rating', 'manual']

/**
 * Price table from `zoneMetrics`, in one of two modes: every district of a
 * city, or a chosen set of zones side by side.
 */
export const zonePriceTableAutoSectionHandler: SectionHandler = async ({
  locale,
  section,
  citySlug,
}) => {
  if (section.enabled === false) return null

  const mode = section.mode === 'compare' ? 'compare' : 'cityDistricts'

  const records =
    mode === 'compare'
      ? await fetchLatestZoneMetricsByZoneIds(
          (Array.isArray(section.zones) ? section.zones : [])
            .map((z) => (z as { _ref?: string } | undefined)?._ref)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        )
      : await fetchLatestZoneMetricsForCityDistricts({
          id: (section.city as { _ref?: string } | undefined)?._ref,
          slug: citySlug,
        })

  if (records.length === 0) return null

  const sortBy = SORTS.includes(section.sortBy as ZoneTableSort)
    ? (section.sortBy as ZoneTableSort)
    : 'price'

  const table = (
    <ZonePriceTableAutoSection
      key={section._key ?? 'zone-price-table-auto'}
      locale={locale}
      records={records}
      titleOverride={resolveLocalizedString(section.title as never, locale) || undefined}
      subtitleOverride={resolveLocalizedString(section.subtitle as never, locale) || undefined}
      columns={section.columns}
      sortBy={sortBy}
      linkRows={section.linkRows !== false}
      showSources={section.showSources !== false}
    />
  )

  // A city's research table is followed by what its live listings ask — the
  // one set of figures on the page nobody else can publish.
  if (mode !== 'cityDistricts' || !citySlug) return table
  return (
    <React.Fragment key={section._key ?? 'zone-price-table-auto'}>
      {table}
      <ListingPriceIndexSection locale={locale} citySlug={citySlug} />
    </React.Fragment>
  )
}
