export function displayStatusLabel(status?: string | null): string | null {
  if (!status) return null
  const s = status.toLowerCase().trim()
  if (s === 'sale') return 'For sale'
  if (s === 'rent') return 'For rent'
  if (s === 'short-term' || s === 'shortterm') return 'Short-term rent'
  if (s === 'long-term' || s === 'longterm') return 'Long-term rent'
  return status
}

export function displayStatusShortLabel(status?: string | null): string | null {
  const full = displayStatusLabel(status)
  if (!full) return null
  const s = full.toLowerCase()
  if (s.includes('short-term')) return 'Short rent'
  if (s.includes('long-term')) return 'Long rent'
  if (s === 'for rent') return 'Rent'
  return full
}

export function displayDealLabel(status?: string | null, opts?: { compact?: boolean }): string | null {
  return opts?.compact ? displayStatusShortLabel(status) : displayStatusLabel(status)
}

export function truncateTeaser(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  if (t.length <= maxChars) return t
  return `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}
