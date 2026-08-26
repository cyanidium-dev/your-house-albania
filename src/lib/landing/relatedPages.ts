import type { LinkedZone } from '@/components/landing/sectionRenderers/handlers/types'

/**
 * Pure context resolution for `relatedPagesAutoSection` (ТЗ-16).
 *
 * Resolution order per mode, first hit wins:
 *   explicit section config → page context (linked zone / route city) →
 *   the page's own `topicTags` → null (the section renders nothing).
 *
 * The own-tags step is what makes the block work on comparison pages and
 * guide hubs, which have no linked zone at all.
 */

export type RelatedPagesSectionInput = {
  mode?: string
  /** Alias slug of the section's explicit `city` reference (GROQ projection). */
  relatedCitySlug?: string | null
  /** Alias of the section's explicit `zone` reference (GROQ projection). */
  relatedZone?: { slug?: string | null } | null
  /** Section-level tag filter (topicGuides mode). */
  topicTags?: unknown
}

export type RelatedPagesPageContext = {
  citySlug?: string
  linkedZone?: LinkedZone
  /** The host landing document's own topicTags. */
  topicTags?: string[]
}

export type RelatedPagesQuery =
  | { kind: 'cityDistricts'; citySlug: string }
  | { kind: 'zoneComparisons'; zoneTags: string[] }
  | { kind: 'topicGuides'; tags: string[] }
  | { kind: 'manual' }

const trimmed = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

function stringTags(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((t) => trimmed(t)).filter(Boolean)
}

export function resolveRelatedPagesQuery(
  section: RelatedPagesSectionInput,
  ctx: RelatedPagesPageContext,
): RelatedPagesQuery | null {
  const ownTags = stringTags(ctx.topicTags)
  switch (section.mode) {
    case 'cityDistricts': {
      const citySlug =
        trimmed(section.relatedCitySlug) ||
        trimmed(ctx.linkedZone?.citySlug) ||
        trimmed(ctx.citySlug) ||
        trimmed(ownTags.find((t) => t.startsWith('city:'))?.slice('city:'.length))
      return citySlug ? { kind: 'cityDistricts', citySlug } : null
    }
    case 'zoneComparisons': {
      const explicit = trimmed(section.relatedZone?.slug)
      if (explicit) return { kind: 'zoneComparisons', zoneTags: [`zone:${explicit}`] }
      const linked = trimmed(ctx.linkedZone?.slug)
      if (linked) return { kind: 'zoneComparisons', zoneTags: [`zone:${linked}`] }
      const zoneTags = ownTags.filter((t) => t.startsWith('zone:'))
      return zoneTags.length ? { kind: 'zoneComparisons', zoneTags } : null
    }
    case 'topicGuides': {
      const sectionTags = stringTags(section.topicTags)
      const tags = sectionTags.length ? sectionTags : ownTags
      return tags.length ? { kind: 'topicGuides', tags } : null
    }
    case 'manual':
      return { kind: 'manual' }
    default:
      return null
  }
}

/** CMS validation is not trusted — `limit` is a shared projection key. 3..8, default 6. */
export function clampRelatedLimit(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 6
  return Math.min(8, Math.max(3, n))
}
