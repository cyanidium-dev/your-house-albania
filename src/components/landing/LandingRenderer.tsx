import * as React from 'react'
import {
  propertiesDealFromLandingContext,
  type PropertiesDealParam,
} from '@/lib/catalog/propertiesDealFromLanding'
import { asSections } from './sectionRenderers/helpers'
import { renderLandingSection } from './sectionRenderers/registry'

export type LandingPageDoc = {
  _id?: string
  _type?: 'landingPage' | string
  pageType?: string
  /** Document slug (e.g. for deal context on generic landings). */
  slug?: string
  pageSections?: import('./sectionRenderers/types').LandingSectionBase[]
  seo?: unknown
}

export async function LandingRenderer({
  locale,
  landing,
  citySlug,
  breadcrumb,
  propertiesDeal: propertiesDealOverride,
}: {
  locale: string
  landing: LandingPageDoc | null
  citySlug?: string
  /** Rendered inside the first section when it is heroSection (avoids white gap above hero) */
  breadcrumb?: React.ReactNode
  /** When set, wins over inferring `deal` from landing pageType/slug for property-type card links. */
  propertiesDeal?: PropertiesDealParam
}) {
  const sections = asSections(landing)
  const propertiesDeal =
    propertiesDealOverride ??
    propertiesDealFromLandingContext({
      pageType: landing?.pageType,
      slug: landing?.slug,
    })
  if (process.env.NODE_ENV === 'development') {
    const types = sections.map((s) => s?._type).filter(Boolean)
    console.log('[LandingRenderer] sections', {
      locale,
      landingId: (landing as any)?._id ?? null,
      pageType: (landing as any)?.pageType ?? null,
      count: sections.length,
      types,
    })
  }

  const nodes: React.ReactNode[] = []

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const isFirstHero = i === 0 && section?._type === 'heroSection'
    const node = await renderLandingSection({
      locale,
      section,
      citySlug,
      breadcrumb: isFirstHero ? breadcrumb : undefined,
      propertiesDeal,
    })
    if (node) nodes.push(node)
  }

  return <main>{nodes}</main>
}
