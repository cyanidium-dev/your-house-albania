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

/**
 * Builds multi-line text suitable for Telegram `sendMessage` `text` later.
 * Labels are stable English for operator readability.
 */
export function formatAgentContactTelegramMessage(
  target: TelegramDeliveryTarget,
  data: NormalizedAgentContactSubmission
): string {
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
