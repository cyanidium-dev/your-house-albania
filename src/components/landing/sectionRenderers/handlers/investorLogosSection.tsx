import * as React from 'react'
import { InvestorLogosSection } from '@/components/landing/sections/InvestorLogosSection'
import type { SectionHandler } from './types'

export const investorLogosSectionHandler: SectionHandler = ({ locale, section }) => (
  <InvestorLogosSection key={section._key ?? 'investorLogos'} locale={locale} section={section} />
)
