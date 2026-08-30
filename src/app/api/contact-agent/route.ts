import { NextResponse } from 'next/server'
import { formatMinMaxLabel } from '@/lib/notifications/agentContact/formatTelegramAgentContact'
import { resolveAgentContactTelegramRouting } from '@/lib/notifications/agentContact/routing'
import { deliverAgentContactTelegram } from '@/lib/notifications/agentContact/telegramDelivery'
import type { NormalizedAgentContactSubmission } from '@/lib/notifications/agentContact/types'
import { getSiteBaseUrl } from '@/lib/siteUrl'

const MAX_MESSAGE = 8000
const MAX_TITLE = 200
const SLUG_REGEX = /^[a-z0-9-]+$/

type Body = {
  submissionKind?: 'agent' | 'general' | 'quote'
  agentSlug?: string
  agentName?: string
  locale?: string
  /** Honeypot — must stay empty for real users. */
  companyWebsite?: string
  city?: string
  propertyType?: string
  deal?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  name?: string
  phone?: string
  email?: string
  message?: string
  /** Property-page context (agent submissions). */
  propertySlug?: string
  propertyTitle?: string
  /** Quote submissions: same-site path the widget was on, and a short placement label. */
  sourcePath?: string
  sourceLabel?: string
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false as const, error }, { status })
}

function jsonOk() {
  return NextResponse.json({ ok: true as const })
}

/**
 * Contact requests: general `/contacts` (`submissionKind: 'general'`), the
 * property-page contact modal (`'agent'`, with property context), or a
 * one-field callback from the blog CTA / floating QuickContact (`'quote'`,
 * phone only plus the page it came from). Validates input, honeypot, then
 * delivers via the Telegram Bot API (same chat for all three).
 */
export async function POST(request: Request) {
  console.log('[contact-agent] submission received')

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError(400, 'Invalid JSON')
  }

  const hp =
    typeof body.companyWebsite === 'string' ? body.companyWebsite.trim() : ''
  if (hp.length > 0) {
    console.warn('[contact-agent] rejected (honeypot)')
    return jsonError(400, 'Bad request')
  }

  const isGeneral = body.submissionKind === 'general'
  const isQuote = body.submissionKind === 'quote'

  // Callback widgets ask for a phone number and nothing else, so they skip the
  // name/email/message requirements the two full forms enforce below.
  if (!isNonEmptyString(body.phone)) {
    return jsonError(400, 'Missing phone')
  }

  let email = ''
  let customerName = ''
  let messageText = ''

  if (!isQuote) {
    if (!isNonEmptyString(body.name)) {
      return jsonError(400, 'Missing name')
    }
    if (!isNonEmptyString(body.email)) {
      return jsonError(400, 'Missing email')
    }
    if (!isNonEmptyString(body.message)) {
      return jsonError(400, 'Missing message')
    }
    if (body.message.length > MAX_MESSAGE) {
      return jsonError(400, 'Message too long')
    }

    email = body.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError(400, 'Invalid email')
    }

    customerName = body.name.trim()
    messageText = body.message.trim()
  }

  const locale =
    typeof body.locale === 'string' && body.locale.trim() ? body.locale.trim() : '—'

  let normalized: NormalizedAgentContactSubmission

  if (isQuote) {
    const urlLocale = /^[a-z]{2}$/.test(locale) ? locale : 'en'
    const rawPath = typeof body.sourcePath === 'string' ? body.sourcePath.trim() : ''
    // Only same-site paths — never echo an attacker-supplied absolute URL.
    const safePath = rawPath.startsWith('/') && !rawPath.startsWith('//') ? rawPath : `/${urlLocale}`

    normalized = {
      submissionKind: 'quote',
      agentSlug: '—',
      agentName: '—',
      locale,
      location: undefined,
      propertyType: undefined,
      dealType: undefined,
      priceRangeLabel: '—',
      areaRangeLabel: '—',
      customerName: isNonEmptyString(body.name) ? body.name.trim().slice(0, MAX_TITLE) : '—',
      phone: body.phone.trim(),
      email: '—',
      message: '',
      sourceLabel: isNonEmptyString(body.sourceLabel)
        ? body.sourceLabel.trim().slice(0, MAX_TITLE)
        : undefined,
      sourceUrl: `${getSiteBaseUrl()}${safePath}`,
    }
  } else if (isGeneral) {
    normalized = {
      submissionKind: 'general',
      agentSlug: '—',
      agentName: '—',
      locale,
      location: body.city?.trim() || undefined,
      propertyType: body.propertyType?.trim() || undefined,
      dealType: body.deal?.trim() || undefined,
      priceRangeLabel: formatMinMaxLabel(
        typeof body.minPrice === 'number' && Number.isFinite(body.minPrice) ? body.minPrice : undefined,
        typeof body.maxPrice === 'number' && Number.isFinite(body.maxPrice) ? body.maxPrice : undefined,
        ' EUR'
      ),
      areaRangeLabel: formatMinMaxLabel(
        typeof body.minArea === 'number' && Number.isFinite(body.minArea) ? body.minArea : undefined,
        typeof body.maxArea === 'number' && Number.isFinite(body.maxArea) ? body.maxArea : undefined,
        ' m²'
      ),
      customerName,
      phone: body.phone.trim(),
      email,
      message: messageText,
    }
  } else {
    if (!isNonEmptyString(body.agentSlug)) {
      return jsonError(400, 'Missing agent')
    }

    const agentName =
      typeof body.agentName === 'string' && body.agentName.trim() ? body.agentName.trim() : '—'

    let propertySlug: string | undefined
    if (typeof body.propertySlug === 'string' && body.propertySlug.trim()) {
      const s = body.propertySlug.trim()
      if (!SLUG_REGEX.test(s)) {
        return jsonError(400, 'Invalid property')
      }
      propertySlug = s
    }
    const propertyTitle =
      typeof body.propertyTitle === 'string' && body.propertyTitle.trim()
        ? body.propertyTitle.trim().slice(0, MAX_TITLE)
        : undefined
    const urlLocale = /^[a-z]{2}$/.test(locale) ? locale : 'en'
    const propertyUrl = propertySlug
      ? `${getSiteBaseUrl()}/${urlLocale}/property/${propertySlug}`
      : undefined

    normalized = {
      submissionKind: 'agent',
      agentSlug: body.agentSlug.trim(),
      agentName,
      locale,
      location: body.city?.trim() || undefined,
      propertyType: body.propertyType?.trim() || undefined,
      dealType: body.deal?.trim() || undefined,
      priceRangeLabel: formatMinMaxLabel(
        typeof body.minPrice === 'number' && Number.isFinite(body.minPrice) ? body.minPrice : undefined,
        typeof body.maxPrice === 'number' && Number.isFinite(body.maxPrice) ? body.maxPrice : undefined,
        ' EUR'
      ),
      areaRangeLabel: formatMinMaxLabel(
        typeof body.minArea === 'number' && Number.isFinite(body.minArea) ? body.minArea : undefined,
        typeof body.maxArea === 'number' && Number.isFinite(body.maxArea) ? body.maxArea : undefined,
        ' m²'
      ),
      customerName,
      phone: body.phone.trim(),
      email,
      message: messageText,
      ...(propertySlug !== undefined ? { propertySlug } : {}),
      ...(propertyTitle !== undefined ? { propertyTitle } : {}),
      ...(propertyUrl !== undefined ? { propertyUrl } : {}),
    }
  }

  console.log('[contact-agent] normalized payload', {
    ...normalized,
    message: `${normalized.message.slice(0, 160)}${normalized.message.length > 160 ? '…' : ''}`,
  })

  const routing = resolveAgentContactTelegramRouting()
  const delivery = await deliverAgentContactTelegram(normalized, routing)

  if (!delivery.ok) {
    console.error('[contact-agent] delivery failed', delivery.reason)
    return jsonError(500, 'Delivery failed')
  }

  console.log('[contact-agent] route success')
  return jsonOk()
}
