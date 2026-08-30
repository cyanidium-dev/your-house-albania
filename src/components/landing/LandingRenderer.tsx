import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import {
  propertiesDealFromLandingContext,
  type PropertiesDealParam,
} from '@/lib/catalog/propertiesDealFromLanding'
import { formatBlogDate } from '@/lib/date/formatLocale'
import { asSections } from './sectionRenderers/helpers'
import { renderLandingSection } from './sectionRenderers/registry'
import type { LinkedZone } from './sectionRenderers/handlers/types'

export type LandingPageDoc = {
  _id?: string
  _type?: 'landingPage' | string
  pageType?: string
  /** Document slug (e.g. for deal context on generic landings). */
  slug?: string
  pageSections?: import('./sectionRenderers/types').LandingSectionBase[]
  seo?: unknown
  /** Editorial freshness date → "Updated: {date}" badge under the hero/H1. */
  contentUpdatedAt?: string
  /**
   * Zone this landing is about, flattened by the landing queries
   * (`linkedDistrict` on district landings, `linkedCity` on city ones).
   * Feeds the zoneMetrics auto blocks in `auto` mode.
   */
  linkedZoneId?: string | null
  linkedZoneType?: 'district' | 'city' | string | null
  linkedZoneSlug?: string | null
  linkedZoneCitySlug?: string | null
  /** Plain interlinking keys (ТЗ-16) — context for the related-pages auto block. */
  topicTags?: string[]
}

function resolveLinkedZone(landing: LandingPageDoc | null): LinkedZone | undefined {
  const id = landing?.linkedZoneId
  if (!id) return undefined
  return {
    type: landing?.linkedZoneType === 'district' ? 'district' : 'city',
    id,
    slug: landing?.linkedZoneSlug ?? undefined,
    citySlug: landing?.linkedZoneCitySlug ?? undefined,
  }
}

function parseContentUpdatedAt(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
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

  // Single-FAQPage-per-page marker: the sequential await loop makes it safe for
  // the first FAQ-capable section (faqSection OR trackerSection with FAQ) to
  // claim JSON-LD emission; later ones skip it.
  const faqJsonLd = { emitted: false }
  const linkedZone = resolveLinkedZone(landing)

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
      linkedZone,
      faqJsonLd,
      landingCtx: { id: landing?._id, topicTags: landing?.topicTags },
    })
    if (node) nodes.push(node)
  }

  // Freshness badge: right after the hero when the page opens with one,
  // otherwise above all sections — one consistent spot for every landing.
  const contentUpdatedAt = parseContentUpdatedAt(landing?.contentUpdatedAt)
  if (contentUpdatedAt) {
    const t = await getTranslations('Landing')
    const badge = (
      <div key="content-updated-at" className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-6">
        <p className="text-xs text-dark/50 dark:text-white/50">
          {t('updatedAt', { date: formatBlogDate(contentUpdatedAt, locale) })}
        </p>
      </div>
    )
    const heroFirst = sections[0]?._type === 'heroSection' && nodes.length > 0
    nodes.splice(heroFirst ? 1 : 0, 0, badge)
  }

  return <main>{nodes}</main>
}
