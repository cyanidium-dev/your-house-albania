import * as React from 'react'
import { PurchaseCostCalcSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const purchaseCostCalcSectionHandler: SectionHandler = ({ locale, section }) => (
  <PurchaseCostCalcSection
    key={section._key ?? 'purchase-cost-calc'}
    locale={locale}
    section={section}
  />
)
