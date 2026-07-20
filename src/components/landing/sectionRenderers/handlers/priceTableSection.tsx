import * as React from 'react'
import { PriceTableSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const priceTableSectionHandler: SectionHandler = ({ locale, section }) => (
  <PriceTableSection key={section._key ?? 'price-table'} locale={locale} section={section} />
)
