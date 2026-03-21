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
}: {
  locale: string
  landing: LandingPageDoc | null
  citySlug?: string
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

  for (const section of sections) {
    const node = await renderLandingSection({ locale, section, citySlug })
    if (node) nodes.push(node)
  }

  return <main>{nodes}</main>
}

