import type { NextRequest } from 'next/server'
import { computeFunnel, formatFunnel, formatWeeklySummary, type FunnelLead } from '@/lib/leads/funnel'
import { leadChatId } from '@/lib/leads/status'
import { resolveAgentContactTelegramRouting, resolveTelegramBotToken } from '@/lib/notifications/agentContact/routing'
import { sendTelegramTextMessage } from '@/lib/notifications/agentContact/telegramBotSend'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { botCall, publicBotToken } from '@/lib/telegram/bot/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Vercel cron sends Authorization: Bearer <CRON_SECRET>. Optional ?secret= for manual/local calls. */
function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${cronSecret}`) return true
  return new URL(request.url).searchParams.get('secret') === cronSecret
}

type Row = FunnelLead & { agentChat?: string | null }

const LEADS = `*[_type == "lead" && !(_id in path("drafts.**"))]{
  _id, type, status, internal, createdAt, statusUpdatedAt, "statusHistory": statusHistory[]{status, at},
  name, phone, email, telegramUsername, propertyTitle, propertySlug, dealPrice,
  "agentChat": coalesce(
    agent->telegramLeadChatId,
    *[_type == "agent" && slug.current == ^.agentSlug && !(_id in path("drafts.**"))][0].telegramLeadChatId
  ),
  "posts": telegramPosts[]{chatId, messageId}
}`

const AGENT_CHATS = `*[_type == "agent" && defined(telegramLeadChatId) && !(_id in path("drafts.**"))].telegramLeadChatId`

/**
 * Monday summary (vercel.json): each lead chat gets its own week - new
 * leads, in work, viewings, deals, and the leads with no status for more than
 * three days, with buttons that post each one again with its status buttons.
 * `TELEGRAM_OWNER_CHAT_ID`, when set, also gets the funnel with the 1 %.
 *
 * `?dry=1` returns the texts without sending anything.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return new Response('Unauthorized', { status: 401 })
  const dry = new URL(request.url).searchParams.get('dry') === '1'
  const client = getWriteClient()
  if (!client) return Response.json({ ok: false, reason: 'SANITY_API_TOKEN not set' }, { status: 503 })
  const token = publicBotToken()
  const deliveryToken = resolveTelegramBotToken()

  const now = new Date()
  const general = resolveAgentContactTelegramRouting().generalChatId
  const [leads, agentChats] = await Promise.all([client.fetch<Row[]>(LEADS), client.fetch<string[]>(AGENT_CHATS)])
  const chats = [...new Set([general, ...agentChats].map((c) => leadChatId(c, undefined)).filter((c): c is string => !!c))]

  const out: { chatId: string; text: string; sent: boolean }[] = []
  for (const chatId of chats) {
    const own = leads.filter((l) => leadChatId(l.agentChat, general) === chatId)
    const summary = formatWeeklySummary(own, chatId, now)
    let sent = false
    if (!dry) {
      if (token) {
        const result = await botCall(token, 'sendMessage', {
          chat_id: chatId,
          text: summary.text,
          link_preview_options: { is_disabled: true },
          ...(summary.keyboard ? { reply_markup: summary.keyboard } : {}),
        })
        sent = result.ok
      }
      // The public bot is not in this chat yet: the list still arrives, without buttons.
      if (!sent && deliveryToken) sent = (await sendTelegramTextMessage({ botToken: deliveryToken, chatId, text: summary.text })).ok
    }
    out.push({ chatId, text: summary.text, sent })
  }

  const owner = process.env.TELEGRAM_OWNER_CHAT_ID?.trim()
  const week = computeFunnel(leads, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now)
  const all = computeFunnel(leads, new Date('2026-01-01T00:00:00Z'), now)
  const ownerText = `📈 Воронка Domlivo\n\nЗа неделю:\n${formatFunnel(week)}\n\nС начала учёта:\n${formatFunnel(all)}`
  let ownerSent = false
  if (owner && token && !dry) ownerSent = (await botCall(token, 'sendMessage', { chat_id: owner, text: ownerText })).ok

  return Response.json(
    { ok: true, dry, chats: out, owner: owner ? { sent: ownerSent } : null, ...(dry ? { ownerText } : {}) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
