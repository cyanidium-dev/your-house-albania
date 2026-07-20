import * as React from 'react'
import { DevelopersRatingSection } from '@/components/landing/sections'
import { fetchDevelopersForRating } from '@/lib/sanity/client'
import type { SectionHandler } from './types'

export const developersRatingSectionHandler: SectionHandler = async ({ locale, section }) => {
  if (section.enabled === false) return null

  const selectedIds =
    section.mode === 'selected'
      ? (Array.isArray(section.developers) ? section.developers : [])
          .map((d) => (d as { _ref?: string })?._ref)
          .filter((x): x is string => typeof x === 'string' && x.length > 0)
      : undefined
  if (section.mode === 'selected' && (!selectedIds || selectedIds.length === 0)) return null

  const developers = await fetchDevelopersForRating(selectedIds)
  if (developers.length === 0) return null

  return (
    <DevelopersRatingSection
      key={section._key ?? 'developers-rating'}
      locale={locale}
      section={section}
      developers={developers}
    />
  )
}
