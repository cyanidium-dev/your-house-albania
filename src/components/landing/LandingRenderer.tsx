export type LandingPageDoc = {
  _id?: string
  _type?: 'landingPage' | string
  pageType?: string
  pageSections?: import('./sectionRenderers/types').LandingSectionBase[]
  seo?: unknown
}
import * as React from 'react'
import { asSections } from './sectionRenderers/helpers'
import { renderLandingSection } from './sectionRenderers/registry'

export async function LandingRenderer({
  locale,
  landing,
  citySlug,
  breadcrumb,
}: {
  locale: string
  landing: LandingPageDoc | null
  citySlug?: string
  /** Rendered inside the first section when it is heroSection (avoids white gap above hero) */
  breadcrumb?: React.ReactNode
}) {
  const sections = asSections(landing)
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
    })
    if (node) nodes.push(node)
  }

  return <main>{nodes}</main>
}

