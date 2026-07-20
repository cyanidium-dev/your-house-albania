import * as React from 'react'
import { SourcesSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const sourcesSectionHandler: SectionHandler = ({ locale, section }) => (
  <SourcesSection key={section._key ?? 'sources'} locale={locale} section={section} />
)
