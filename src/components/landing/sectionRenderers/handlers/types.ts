import type * as React from 'react'
import type { LandingSectionBase } from '../types'

export type SectionHandler = (input: {
  locale: string
  section: LandingSectionBase
  citySlug?: string
  /** Passed when first section is heroSection for breadcrumb overlay */
  breadcrumb?: React.ReactNode
}) => Promise<React.ReactNode | null> | React.ReactNode | null

