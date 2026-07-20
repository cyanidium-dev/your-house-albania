import * as React from 'react'
import { MortgageCalcSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const mortgageCalcSectionHandler: SectionHandler = ({ locale, section }) => (
  <MortgageCalcSection key={section._key ?? 'mortgage-calc'} locale={locale} section={section} />
)
