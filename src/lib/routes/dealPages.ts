import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'

/**
 * Canonical marketing routes for deal types (`src/app/[locale]/sale`, `rent`, `short-term-rent`).
 */
export function dealMarketingPagePath(
  locale: string,
  deal: PropertiesDealParam,
): string {
  if (deal === 'short-term') return `/${locale}/short-term-rent`
  return `/${locale}/${deal}`
}
