import type { NormalizedAgentContactSubmission, TelegramDeliveryTarget } from './types'

/** Human-readable range for logs / Telegram (not locale-specific; delivery layer). */
export function formatMinMaxLabel(
  min: number | undefined,
  max: number | undefined,
  suffix: string
): string {
  const a = min !== undefined && Number.isFinite(min) ? String(Math.round(min)) : null
  const b = max !== undefined && Number.isFinite(max) ? String(Math.round(max)) : null
  if (a === null && b === null) return '—'
  return `${a ?? '—'} – ${b ?? '—'}${suffix}`
}

function line(label: string, value: string): string {
  return `${label}: ${value}`
}

function emptyToDash(v: string | undefined): string {
  if (v === undefined || v === null) return '—'
  const s = String(v).trim()
  return s.length ? s : '—'
}

/** Adds thousands separators to digit runs (for budget/area lines from `formatMinMaxLabel`). */
function withThousandsSeparators(s: string): string {
  if (s === '—') return '—'
  return s.replace(/\d+/g, (digits) => {
    const n = Number(digits)
    return Number.isFinite(n) ? n.toLocaleString('en-US') : digits
  })
}

/** Title-cases filter values for operator scanning; keeps em dash for missing. */
function prettyFilterValue(s: string | undefined): string {
  const v = emptyToDash(s)
  if (v === '—') return '—'
  const sep = v.includes('-') ? '-' : ' '
  return v
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(sep)
}

function languageLabel(locale: string): string {
  const t = typeof locale === 'string' ? locale.trim() : ''
  if (!t || t === '—') return '—'
  if (/^[a-z]{2}(-[a-z]{2})?$/i.test(t)) return t.toUpperCase()
  return t
}

/**
 * Builds multi-line text suitable for Telegram `sendMessage` `text` later.
 * Labels are stable English for operator readability.
 */
export function formatAgentContactTelegramMessage(
  target: TelegramDeliveryTarget,
  data: NormalizedAgentContactSubmission
): string {
  if (data.submissionKind === 'general') {
    return [
      'New contact request',
      '',
      `Language: ${languageLabel(data.locale)}`,
      `Location: ${prettyFilterValue(data.location)}`,
      `Property type: ${prettyFilterValue(data.propertyType)}`,
      `Deal type: ${prettyFilterValue(data.dealType)}`,
      `Budget: ${withThousandsSeparators(data.priceRangeLabel)}`,
      `Area: ${withThousandsSeparators(data.areaRangeLabel)}`,
      '',
      `Name: ${data.customerName}`,
      `Phone: ${data.phone}`,
      `Email: ${data.email}`,
      '',
      'Message:',
      data.message,
    ].join('\n')
  }

  const header =
    target === 'general'
      ? '[target: general] Agent contact request'
      : '[target: agent] Agent contact request (personal)'

  return [
    header,
    line('agent_slug', data.agentSlug),
    line('agent_name', emptyToDash(data.agentName)),
    line('locale', data.locale),
    line('location', emptyToDash(data.location)),
    line('property_type', emptyToDash(data.propertyType)),
    line('deal_type', emptyToDash(data.dealType)),
    line('price_range', data.priceRangeLabel),
    line('area_range', data.areaRangeLabel),
    line('customer_name', data.customerName),
    line('customer_phone', data.phone),
    line('customer_email', data.email),
    '---',
    'message:',
    data.message,
  ].join('\n')
}
