import * as React from 'react'
import { LinkedGallerySection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const linkedGallerySectionHandler: SectionHandler = ({ locale, section }) => (
  <LinkedGallerySection key={section._key ?? 'linkedGallery'} locale={locale} section={section} />
)

