import { NextResponse, type NextRequest } from 'next/server'
import { clientKeyFromHeaders } from '@/lib/ai/rateLimit'
import { guideLeadInput, guidePdfPath, parseGuideRequest } from '@/lib/guides/durresGuide'
import { countryFromHeaders } from '@/lib/leads/buildLeadDocument'
import { createClickThrottle, isLikelyBot } from '@/lib/leads/clickGuard'
import { parseLeadContext } from '@/lib/leads/context'
import { createLead, lookupLeadProperty } from '@/lib/leads/createLead'
import { propertyUrl } from '@/lib/leads/clickRequest'
import {
  resolveAgentContactTelegramRouting,
  resolveTelegramBotToken,
} from '@/lib/notifications/agentContact/routing'
import { sendTelegramTextMessage } from '@/lib/notifications/agentContact/telegramBotSend'
import { formatGuideLeadTelegram } from '@/lib/notifications/leads/formatLeadTelegram'
import { getSiteBaseUrl } from '@/lib/siteUrl'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 32 * 1024
/** One guide request per client per window; a resubmit within it is answered with the same URL, not a second lead. */
const THROTTLE_MS = 60_000
const allow = createClickThrottle(THROTTLE_MS)

const GUIDE_TITLE = 'Buying in Durrës: prices, taxes, steps'

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * The gate in front of the Durrës buying guide: an email and consent in, the
 * static PDF's URL out. The lead is saved to Sanity (`guide_download`,
 * placement `guide`, with the listing the visitor was on) and posted to
 * Telegram like every other form. Honeypot, bot UA filter and a per-client
 * throttle guard it, as `/api/leads/click` does; the PDF itself is a public
 * file under `/guides/`, so this route only ever does the bookkeeping.
 */
export async function POST(req: NextRequest) {
  if (isLikelyBot(req.headers.get('user-agent'))) {
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return json(400, { ok: false, error: 'Invalid body' })
  }
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, error: 'Body too large' })

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' })
  }

  const parsed = parseGuideRequest(body)
  if (!parsed.ok) {
    if (parsed.error === 'Bad request') console.warn('[guide-request] rejected (honeypot)')
    return json(400, { ok: false, error: parsed.error })
  }
  const request = parsed.value
  const url = guidePdfPath(request.locale)

  // A double click or a retry inside the window gets the file without a second lead.
  if (!allow(clientKeyFromHeaders(req.headers), 'guide_download', Date.now())) {
    return json(200, { ok: true, url, duplicate: true })
  }

  const context = parseLeadContext(request.context)
  const country = countryFromHeaders(req.headers)
  const property = request.propertySlug ? await lookupLeadProperty(request.propertySlug) : null

  const botToken = resolveTelegramBotToken()
  const chatId = resolveAgentContactTelegramRouting().generalChatId
  const telegram = async () => {
    if (!botToken || !chatId) {
      console.error('[guide-request] Telegram not configured', { hasBotToken: !!botToken, hasChatId: !!chatId })
      return { ok: false as const, reason: 'Telegram not configured' }
    }
    const text = formatGuideLeadTelegram({
      email: request.email,
      guideTitle: `${GUIDE_TITLE} (${request.locale.toUpperCase()})`,
      ...(context ? { context } : {}),
      ...(country ? { country } : {}),
      locale: request.locale,
      ...(request.propertySlug
        ? {
            property: {
              slug: request.propertySlug,
              ...(property?.title ? { title: property.title } : {}),
              url: propertyUrl(getSiteBaseUrl(), request.locale, request.propertySlug),
            },
          }
        : {}),
    })
    return sendTelegramTextMessage({ botToken, chatId, text })
  }

  const [lead, delivery] = await Promise.all([
    createLead({
      ...guideLeadInput(request, { ...(context ? { context } : {}), ...(country ? { country } : {}), now: new Date() }),
      ...(request.propertySlug ? { property } : {}),
    }),
    telegram(),
  ])

  if (!lead.ok) console.error('[guide-request] lead not saved', lead.reason)
  if (!delivery.ok) console.error('[guide-request] Telegram delivery failed', delivery.reason)

  // The visitor gave a valid email for a file that is public anyway: never
  // withhold it because our own bookkeeping failed.
  return json(200, { ok: true, url })
}
