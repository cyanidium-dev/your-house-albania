/**
 * Plain-text Telegram body for public register form (`POST /api/registration-request`).
 * Kept separate from contact-agent formatters.
 */

export type RegistrationTelegramFields = {
  name: string
  phone: string
  language: string
  email?: string
  realtorOrAgency?: 'realtor' | 'agency'
}

function emptyToDash(v: string | undefined): string {
  if (v === undefined || v === null) return '—'
  const s = String(v).trim()
  return s.length ? s : '—'
}

function languageLabel(locale: string): string {
  const t = locale.trim()
  if (!t || t === '—') return '—'
  if (/^[a-z]{2}(-[a-z]{2})?$/i.test(t)) return t.toUpperCase()
  return t
}

function profileTypeLabel(v: RegistrationTelegramFields['realtorOrAgency']): string {
  if (v === 'realtor') return 'Realtor'
  if (v === 'agency') return 'Agency'
  return '—'
}

/**
 * Human-friendly, compact layout for operators (Telegram plain text).
 */
export function formatTelegramRegistrationRequestMessage(
  data: RegistrationTelegramFields,
): string {
  return [
    'New registration request',
    '',
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Language: ${languageLabel(data.language)}`,
    `Email: ${emptyToDash(data.email)}`,
    `Profile type: ${profileTypeLabel(data.realtorOrAgency)}`,
  ].join('\n')
}
