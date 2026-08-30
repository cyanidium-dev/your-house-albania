/**
 * Reads the same `Shared.propertyDetail.dealType*` keys the property detail
 * page already translates into all 6 locales — pass `useTranslations('Shared.propertyDetail')`.
 */
export type DealTypeTranslate = (key: string) => string

export function displayStatusLabel(status: string | null | undefined, t: DealTypeTranslate): string | null {
  if (!status) return null
  const s = status.toLowerCase().trim()
  if (s === 'sale') return t('dealTypeSale')
  if (s === 'rent') return t('dealTypeRent')
  if (s === 'short-term' || s === 'shortterm') return t('dealTypeShortTerm')
  if (s === 'long-term' || s === 'longterm') return t('dealTypeLongTerm')
  return status
}

export function displayStatusShortLabel(status: string | null | undefined, t: DealTypeTranslate): string | null {
  if (!status) return null
  const s = status.toLowerCase().trim()
  if (s === 'short-term' || s === 'shortterm') return t('dealTypeShortTermCompact')
  if (s === 'long-term' || s === 'longterm') return t('dealTypeLongTermCompact')
  return displayStatusLabel(status, t)
}

export function displayDealLabel(
  status: string | null | undefined,
  t: DealTypeTranslate,
  opts?: { compact?: boolean }
): string | null {
  return opts?.compact ? displayStatusShortLabel(status, t) : displayStatusLabel(status, t)
}

export function truncateTeaser(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  if (t.length <= maxChars) return t
  return `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}
