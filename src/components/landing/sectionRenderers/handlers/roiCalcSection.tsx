import * as React from 'react'
import { RoiCalcSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const roiCalcSectionHandler: SectionHandler = ({ locale, section }) => (
  <RoiCalcSection key={section._key ?? 'roi-calc'} locale={locale} section={section} />
)
