import type { NormalizedAgentContactSubmission } from './types'

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
 * Builds multi-line text suitable for Telegram `sendMessage` `text`.
 * Labels are stable English for operator readability. Both kinds are
 * delivered to the same general chat for now.
 */
export function formatAgentContactTelegramMessage(
  data: NormalizedAgentContactSubmission
): string {
  if (data.submissionKind === 'quote') {
    // Callback request: the operator promised a quote within an hour, so the
    // phone number and the originating page lead the message.
    return [
      '⏱ Quote request (call back within 1h)',
      '',
      `Phone: ${data.phone}`,
      `Name: ${emptyToDash(data.customerName)}`,
      `Language: ${languageLabel(data.locale)}`,
      `Placement: ${emptyToDash(data.sourceLabel)}`,
      `Page: ${emptyToDash(data.sourceUrl)}`,
    ].join('\n')
  }

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

  return [
    'New property contact request',
    '',
    line('Property', emptyToDash(data.propertyTitle)),
    ...(data.propertyUrl ? [line('Link', data.propertyUrl)] : []),
    line('Agent', `${emptyToDash(data.agentName)} (${data.agentSlug})`),
    `Language: ${languageLabel(data.locale)}`,
    '',
    `Name: ${data.customerName}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    '',
    'Message:',
    data.message,
  ].join('\n')
}
