import * as React from 'react'
import { LandingGridSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const landingGridSectionHandler: SectionHandler = ({ locale, section }) => (
  <LandingGridSection key={section._key ?? 'landingGrid'} locale={locale} section={section} />
)

