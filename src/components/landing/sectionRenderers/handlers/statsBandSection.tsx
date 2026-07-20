import * as React from 'react'
import { StatsBandSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const statsBandSectionHandler: SectionHandler = ({ locale, section }) => (
  <StatsBandSection key={section._key ?? 'stats-band'} locale={locale} section={section} />
)
