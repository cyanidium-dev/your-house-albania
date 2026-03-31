import { NextResponse } from 'next/server'
import { formatMinMaxLabel } from '@/lib/notifications/agentContact/formatTelegramAgentContact'
import { resolveAgentContactTelegramRouting } from '@/lib/notifications/agentContact/routing'
import { deliverAgentContactTelegramStub } from '@/lib/notifications/agentContact/telegramStubDelivery'
import type { NormalizedAgentContactSubmission } from '@/lib/notifications/agentContact/types'

const MAX_MESSAGE = 8000

type Body = {
  submissionKind?: 'agent' | 'general'
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
 * Contact requests: general `/contacts` (`submissionKind: 'general'`) or future agent-specific payloads.
 * Validates input, honeypot, then runs Telegram delivery stub.
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

  if (!isNonEmptyString(body.name)) {
    return jsonError(400, 'Missing name')
  }
  if (!isNonEmptyString(body.phone)) {
    return jsonError(400, 'Missing phone')
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

  const email = body.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError(400, 'Invalid email')
  }

  const locale =
    typeof body.locale === 'string' && body.locale.trim() ? body.locale.trim() : '—'

  let normalized: NormalizedAgentContactSubmission

  if (isGeneral) {
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
      customerName: body.name.trim(),
      phone: body.phone.trim(),
      email,
      message: body.message.trim(),
    }
  } else {
    if (!isNonEmptyString(body.agentSlug)) {
      return jsonError(400, 'Missing agent')
    }

    const agentName =
      typeof body.agentName === 'string' && body.agentName.trim() ? body.agentName.trim() : '—'

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
      customerName: body.name.trim(),
      phone: body.phone.trim(),
      email,
      message: body.message.trim(),
    }
  }

  console.log('[contact-agent] normalized payload', {
    ...normalized,
    message: `${normalized.message.slice(0, 160)}${normalized.message.length > 160 ? '…' : ''}`,
  })

  const routing = resolveAgentContactTelegramRouting()
  const delivery = await deliverAgentContactTelegramStub(normalized, routing)

  if (!delivery.ok) {
    console.error('[contact-agent] delivery failed', delivery.reason)
    return jsonError(500, 'Delivery failed')
  }

  console.log('[contact-agent] route success')
  return jsonOk()
}
