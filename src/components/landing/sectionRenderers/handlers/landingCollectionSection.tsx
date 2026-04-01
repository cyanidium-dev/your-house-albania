import * as React from 'react'
import { LandingCollectionSection } from '@/components/landing/sections/LandingCollectionSection'
import type { SectionHandler } from './types'

export const landingCollectionSectionHandler: SectionHandler = ({ locale, section }) => (
  <LandingCollectionSection
    key={section._key ?? 'landingCollection'}
    locale={locale}
    section={section}
  />
)
