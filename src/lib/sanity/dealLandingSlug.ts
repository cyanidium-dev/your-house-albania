import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'

/**
 * Maps app/catalog deal keys to the Sanity `landingPage` document slug.
 * Deal landings are identified only by slug (CMS: pageType is shared, e.g. "investment").
 *
 * | deal        | slug.current      |
 * |-------------|-------------------|
 * | sale        | sale              |
 * | rent        | long-term-rent    |
 * | short-term  | short-term-rent   |
 */
export function dealTypeToLandingDocumentSlug(deal: PropertiesDealParam): string {
  switch (deal) {
    case 'sale':
      return 'sale'
    case 'rent':
      return 'long-term-rent'
    case 'short-term':
      return 'short-term-rent'
    default:
      return ''
  }
}
