/**
 * Deal badge label = dictionary key under `Shared.propertyDetail` (localized
 * ×5 locales; English was hardcoded here before — CQ-01 fix).
 */
export function dealLabelKey(
  status?: string | null,
  opts?: { compact?: boolean },
): string | null {
  if (!status) return null
  const s = status.toLowerCase().trim()
  const compact = opts?.compact === true
  if (s === 'sale') return 'dealTypeSale'
  if (s === 'rent') return 'dealTypeRent'
  if (s === 'short-term' || s === 'shortterm') return compact ? 'dealTypeShortTermCompact' : 'dealTypeShortTerm'
  if (s === 'long-term' || s === 'longterm') return compact ? 'dealTypeLongTermCompact' : 'dealTypeLongTerm'
  return null
}

export function truncateTeaser(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  if (t.length <= maxChars) return t
  return `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}
