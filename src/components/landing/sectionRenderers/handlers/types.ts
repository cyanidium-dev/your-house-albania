import type * as React from 'react'
import type { LandingSectionBase } from '../types'

export type SectionHandler = (input: {
  locale: string
  section: LandingSectionBase
  citySlug?: string
}) => Promise<React.ReactNode | null> | React.ReactNode | null

