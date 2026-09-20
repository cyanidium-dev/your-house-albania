import { after, type NextRequest } from 'next/server'
import { clientKeyFromHeaders } from '@/lib/ai/rateLimit'
import { countryFromHeaders } from '@/lib/leads/buildLeadDocument'
import { createClickThrottle, isLikelyBot } from '@/lib/leads/clickGuard'
import { MAX_CLICK_BODY_BYTES, parseClickLeadBody, propertyUrl } from '@/lib/leads/clickRequest'
import { createLead, lookupLeadProperty } from '@/lib/leads/createLead'
import {
  resolveAgentContactTelegramRouting,
  resolveTelegramBotToken,
} from '@/lib/notifications/agentContact/routing'
import { sendTelegramTextMessage } from '@/lib/notifications/agentContact/telegramBotSend'
import { formatClickLeadTelegram } from '@/lib/notifications/leads/formatLeadTelegram'
import { getSiteBaseUrl } from '@/lib/siteUrl'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const allow = createClickThrottle()

function status(code: number, error?: string) {
  return error
    ? Response.json({ ok: false, error }, { status: code, headers: { 'Cache-Control': 'no-store' } })
    : new Response(null, { status: code, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * A visitor clicked a WhatsApp, Telegram, phone or email link. The browser sends this
 * with `sendBeacon` as it leaves for the app, so nothing waits on the answer:
 * validation happens up front, and the Sanity write and the Telegram message
 * run after the response is sent.
 */
export async function POST(req: NextRequest) {
  if (isLikelyBot(req.headers.get('user-agent'))) return status(204)

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return status(400, 'Invalid body')
  }
  if (raw.length > MAX_CLICK_BODY_BYTES) return status(413, 'Body too large')

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return status(400, 'Invalid JSON')
  }

  const parsed = parseClickLeadBody(json)
  if (!parsed.ok) return status(400, parsed.error)
  const body = parsed.value

  if (!allow(clientKeyFromHeaders(req.headers), body.type, Date.now())) {
    return status(429, 'Too many requests')
  }

  const country = countryFromHeaders(req.headers)
  const locale = body.locale ?? body.context?.locale

  after(async () => {
    const property = body.propertySlug ? await lookupLeadProperty(body.propertySlug) : null

    const botToken = resolveTelegramBotToken()
    const chatId = resolveAgentContactTelegramRouting().generalChatId

    const telegram = async () => {
      if (!botToken || !chatId) {
        console.error('[leads/click] Telegram not configured', { hasBotToken: !!botToken, hasChatId: !!chatId })
        return
      }
      const text = formatClickLeadTelegram({
        type: body.type,
        placement: body.placement,
        ...(body.context ? { context: body.context } : {}),
        ...(country ? { country } : {}),
        ...(locale ? { locale } : {}),
        ...(body.propertySlug
          ? {
              property: {
                slug: body.propertySlug,
                ...(property?.title ? { title: property.title } : {}),
                url: propertyUrl(getSiteBaseUrl(), locale, body.propertySlug),
              },
            }
          : {}),
      })
      const result = await sendTelegramTextMessage({ botToken, chatId, text })
      if (!result.ok) console.error('[leads/click] Telegram delivery failed', result.reason)
    }

    const [lead] = await Promise.all([
      createLead({
        type: body.type,
        placement: body.placement,
        ...(locale ? { locale } : {}),
        ...(body.context ? { context: body.context } : {}),
        ...(country ? { country } : {}),
        ...(body.propertySlug ? { propertySlug: body.propertySlug, property } : {}),
        now: new Date(),
      }),
      telegram(),
    ])
    if (!lead.ok) console.error('[leads/click] lead not saved', lead.reason)
  })

  return status(202)
}
