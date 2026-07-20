import * as React from 'react'
import { DeveloperCardSection } from '@/components/landing/sections'
import { fetchDeveloperById } from '@/lib/sanity/client'
import type { SectionHandler } from './types'

export const developerCardSectionHandler: SectionHandler = async ({ locale, section }) => {
  if (section.enabled === false) return null
  const ref = section.developer?._ref
  if (!ref) return null
  const developer = await fetchDeveloperById(ref)
  // Missing or unpublished developer → render nothing.
  if (!developer) return null

  return (
    <DeveloperCardSection
      key={section._key ?? 'developer-card'}
      locale={locale}
      section={section}
      developer={developer}
    />
  )
}
