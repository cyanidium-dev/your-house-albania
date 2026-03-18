import * as React from 'react'
import { DistrictsComparisonSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const districtsComparisonSectionHandler: SectionHandler = ({ locale, section }) => (
  <DistrictsComparisonSection key={section._key ?? 'districts'} locale={locale} section={section} />
)

