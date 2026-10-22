import 'server-only'

import { randomUUID } from 'node:crypto'
import { htmlSafe, isLeadId, MAX_TEXT, statusKeyboard, statusLine, type TelegramPost } from '@/lib/leads/status'
import { resolveTelegramBotToken } from '@/lib/notifications/agentContact/routing'
import { sendTelegramTextMessage } from '@/lib/notifications/agentContact/telegramBotSend'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { botCall, publicBotToken } from '@/lib/telegram/bot/api'
import { leadScopeLabel, type LeadScope } from '@/lib/notifications/leads/leadRecipients'

export type PostLeadResult = { ok: true; posts: TelegramPost[] } | { ok: false; reason: string }

function htmlToPlain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Remembers where the lead was posted: the weekly list links to it, buttons are checked against it. */
async function recordPosts(leadId: string, posts: TelegramPost[]): Promise<void> {
  const client = getWriteClient()
  if (!client || posts.length === 0) return
  try {
    await client
      .patch(leadId)
      .setIfMissing({ telegramPosts: [] })
      .append(
        'telegramPosts',
        posts.map((p) => ({ _key: randomUUID().slice(0, 12), _type: 'telegramPost', ...p })),
      )
      .commit()
  } catch (err) {
    console.error('[leads] telegram posts not recorded', err instanceof Error ? err.message : err)
  }
}

/**
 * Posts a lead to its team chat(s) (docs: reports/domlivo-leads-funnel.md).
 *
 * With a saved lead, the public bot posts it with the status line and the
 * six status buttons: presses come back to its webhook. Without one (the
 * Sanity write failed) there is nothing for the buttons to change, and a form
 * lead goes out as before, from the delivery bot. `viaPublicBot` is for the
 * bot's own messages, which must come from the public bot for "Ответить" to
 * reach the visitor.
 *
 * If the public bot cannot post in a chat (not a member, or not an admin of
 * a channel), the delivery bot posts the same text without buttons: the lead
 * is never lost, only the buttons are. That post is recorded on the lead too
 * (owner, 2026-10-22: a click on a Grinchenko listing showed no delivery in
 * the base, because only the public bot's posts were written down).
 */
export async function postLeadToTeam(params: {
  chatIds: string[]
  text: string
  /** `HTML` for the bot's messages; form messages are plain text. */
  parseMode?: 'HTML'
  leadId?: string | null
  /** The status the lead was saved with (`spam` for test traffic). */
  status?: string
  viaPublicBot?: boolean
  /** Unique or general: the label goes on the first line. */
  scope?: LeadScope
}): Promise<PostLeadResult> {
  const { chatIds, parseMode } = params
  const text = params.scope ? `${leadScopeLabel(params.scope)}\n\n${params.text}` : params.text
  if (chatIds.length === 0) return { ok: false, reason: 'no team chat configured' }
  const leadId = isLeadId(params.leadId) ? params.leadId : null
  const publicToken = publicBotToken()
  const usePublic = Boolean(publicToken) && (leadId !== null || params.viaPublicBot === true)

  let body = text
  if (leadId) {
    const line = statusLine({ leadId, status: params.status ?? 'new' })
    const tail = `\n\n${parseMode === 'HTML' ? htmlSafe(line) : line}`
    // A plain-text cut never splits a tag; an HTML message this long does not occur.
    body = `${text.length + tail.length > MAX_TEXT ? text.slice(0, MAX_TEXT - tail.length) : text}${tail}`
  }

  const posts: TelegramPost[] = []
  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      if (usePublic && publicToken) {
        const sent = await botCall<{ message_id: number }>(publicToken, 'sendMessage', {
          chat_id: chatId,
          text: body,
          ...(parseMode ? { parse_mode: parseMode } : {}),
          link_preview_options: { is_disabled: true },
          ...(leadId ? { reply_markup: statusKeyboard(leadId, params.status) } : {}),
        })
        if (sent.ok) {
          posts.push({ chatId, messageId: sent.result.message_id })
          return true
        }
      }
      const deliveryToken = resolveTelegramBotToken()
      if (!deliveryToken) return false
      const fallback = await sendTelegramTextMessage({
        botToken: deliveryToken,
        chatId,
        text: parseMode === 'HTML' ? htmlToPlain(text) : text,
      })
      if (fallback.ok && fallback.messageId) posts.push({ chatId, messageId: fallback.messageId })
      return fallback.ok
    }),
  )

  if (leadId) await recordPosts(leadId, posts)
  return results.some(Boolean) ? { ok: true, posts } : { ok: false, reason: 'Telegram delivery failed' }
}
