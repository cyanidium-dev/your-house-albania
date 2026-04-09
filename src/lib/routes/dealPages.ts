import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'

/** Canonical editorial investment routes for deal pages (`src/app/[locale]/investment/...`). */
export function dealMarketingPagePath(
  locale: string,
  deal: PropertiesDealParam,
): string {
  if (deal === 'short-term') return `/${locale}/investment/short-term-rent`
  return `/${locale}/investment/${deal}`
}
