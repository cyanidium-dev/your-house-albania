import 'server-only'

import { randomUUID } from 'node:crypto'
import {
  dealPricePrompt,
  formatEuro,
  formatLeadCard,
  leadBelongsToChat,
  leadCode,
  leadIdFromDealMarker,
  parseDealPrice,
  parseLeadCallback,
  STATUS_LABEL,
  statusKeyboard,
  statusLine,
  whoPressed,
  withStatusLine,
  type ButtonStatus,
  type LeadCardRow,
  type MessageEntity,
  type TelegramPost,
} from '@/lib/leads/status'
import type { LeadStatus } from '@/lib/leads/types'
import { resolveAgentContactTelegramRouting } from '@/lib/notifications/agentContact/routing'
import { postLeadToTeam } from '@/lib/notifications/leads/postLeadToTeam'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { botCall, botUserId } from './api'
import type { TelegramUser } from './format'

/** The parts of a team-chat message the status buttons read. */
export type TeamMessage = {
  message_id: number
  from?: TelegramUser
  author_signature?: string
  chat: { id: number; type: 'private' | 'group' | 'supergroup' | 'channel'; title?: string }
  text?: string
  caption?: string
  entities?: MessageEntity[]
  caption_entities?: MessageEntity[]
  reply_to_message?: TeamMessage
}

export type TelegramCallbackQuery = {
  id: string
  from: TelegramUser
  message?: TeamMessage
  data?: string
}

export type LeadRow = LeadCardRow & {
  agentChat?: string | null
  posts?: TelegramPost[] | null
}

/**
 * The lead and the chat it belongs to: its agent's group, by reference or
 * by slug (a form lead may carry only the slug).
 */
export const LEAD_ROW = `{
  _id, type, status, createdAt, name, phone, email, message, telegramUserId, telegramUsername,
  propertyTitle, propertySlug, dealPrice,
  "agentChat": coalesce(
    agent->telegramLeadChatId,
    *[_type == "agent" && slug.current == ^.agentSlug && !(_id in path("drafts.**"))][0].telegramLeadChatId
  ),
  "posts": telegramPosts[]{chatId, messageId}
}`

async function loadLead(leadId: string): Promise<LeadRow | null> {
  const client = getWriteClient()
  if (!client) return null
  try {
    return await client.fetch<LeadRow | null>(`*[_type == "lead" && _id == $id][0]${LEAD_ROW}`, { id: leadId })
  } catch (err) {
    console.error('[lead-status] lead lookup failed', err instanceof Error ? err.message : err)
    return null
  }
}

function generalChatId(): string | undefined {
  return resolveAgentContactTelegramRouting().generalChatId
}

async function answer(token: string, id: string, text: string, alert = false) {
  await botCall(token, 'answerCallbackQuery', { callback_query_id: id, text, ...(alert ? { show_alert: true } : {}) })
}

/** Writes the status with who and when; the history keeps every press for the funnel. */
export async function saveLeadStatus(
  leadId: string,
  change: { status: ButtonStatus; from: string; by: string; chatId: string; at: Date },
): Promise<boolean> {
  const client = getWriteClient()
  if (!client) return false
  const at = change.at.toISOString()
  try {
    await client
      .patch(leadId)
      .set({ status: change.status, statusUpdatedAt: at, statusUpdatedBy: change.by })
      .setIfMissing({ statusHistory: [] })
      .append('statusHistory', [
        {
          _key: randomUUID().slice(0, 12),
          _type: 'leadStatusChange',
          status: change.status,
          from: change.from,
          at,
          by: change.by,
          chatId: change.chatId,
        },
      ])
      .commit()
    return true
  } catch (err) {
    console.error('[lead-status] status not saved', err instanceof Error ? err.message : err)
    return false
  }
}

/** Rewrites the status line and marks the pressed button. Text or caption, entities kept. */
async function refreshMessage(token: string, message: TeamMessage, leadId: string, line: string, status: string) {
  const keyboard = statusKeyboard(leadId, status)
  const target = { chat_id: message.chat.id, message_id: message.message_id }
  if (typeof message.text === 'string') {
    const next = withStatusLine(message.text, message.entities, line)
    await botCall(token, 'editMessageText', {
      ...target,
      text: next.text,
      entities: next.entities,
      link_preview_options: { is_disabled: true },
      reply_markup: keyboard,
    })
  } else if (typeof message.caption === 'string') {
    const next = withStatusLine(message.caption, message.caption_entities, line, 1024)
    await botCall(token, 'editMessageCaption', {
      ...target,
      caption: next.text,
      caption_entities: next.entities,
      reply_markup: keyboard,
    })
  } else {
    await botCall(token, 'editMessageReplyMarkup', { ...target, reply_markup: keyboard })
  }
}

/**
 * A press on a lead message (or on a number in the weekly list). Never
 * messages the client: only Sanity and the team chat change.
 */
export async function handleLeadCallback(token: string, query: TelegramCallbackQuery): Promise<void> {
  const parsed = parseLeadCallback(query.data)
  const message = query.message
  if (!parsed || !message) {
    await answer(token, query.id, '')
    return
  }
  if (message.chat.type === 'private') {
    await answer(token, query.id, 'Статусы меняются только в чате команды.')
    return
  }
  const chatId = String(message.chat.id)
  const lead = await loadLead(parsed.leadId)
  if (!lead || !leadBelongsToChat(lead, chatId, generalChatId())) {
    await answer(token, query.id, 'Эта заявка не найдена в этом чате.', true)
    return
  }

  if (parsed.kind === 'open') {
    await postLeadToTeam({ chatIds: [chatId], text: formatLeadCard(lead), leadId: lead._id, status: lead.status })
    await answer(token, query.id, `Заявка #${leadCode(lead._id)} - ниже`)
    return
  }

  const by = whoPressed(query.from)
  const now = new Date()
  if (lead.status !== parsed.status) {
    const saved = await saveLeadStatus(lead._id, { status: parsed.status, from: lead.status, by, chatId, at: now })
    if (!saved) {
      await answer(token, query.id, 'Не сохранилось, нажмите ещё раз.', true)
      return
    }
  }
  const line = statusLine({
    leadId: lead._id,
    status: parsed.status,
    by,
    at: now,
    ...(parsed.status === 'won' && lead.dealPrice ? { price: lead.dealPrice } : {}),
  })
  await refreshMessage(token, message, lead._id, line, parsed.status)
  await answer(token, query.id, `Статус: ${STATUS_LABEL[parsed.status as LeadStatus]}`)

  if (parsed.status === 'won' && !lead.dealPrice) {
    const group = message.chat.type === 'group' || message.chat.type === 'supergroup'
    await botCall(token, 'sendMessage', {
      chat_id: message.chat.id,
      text: dealPricePrompt(lead._id),
      reply_parameters: { message_id: message.message_id, allow_sending_without_reply: true },
      ...(group ? { reply_markup: { force_reply: true, input_field_placeholder: 'Цена в евро, например 85000' } } : {}),
    })
  }
}

/**
 * A reply to the price question. Returns false when the message is not one,
 * so the caller can treat it as a reply to a client.
 */
export async function handleDealPriceReply(token: string, message: TeamMessage): Promise<boolean> {
  const question = message.reply_to_message
  const leadId = leadIdFromDealMarker(question?.text)
  if (!question || !leadId) return false
  // In a group only the bot's own question counts; in a channel only admins post at all.
  if (message.chat.type !== 'channel' && question.from?.id !== botUserId(token)) return false

  const chatId = String(message.chat.id)
  const lead = await loadLead(leadId)
  if (!lead || !leadBelongsToChat(lead, chatId, generalChatId())) return true

  const reply = (text: string) =>
    botCall(token, 'sendMessage', {
      chat_id: message.chat.id,
      text,
      reply_parameters: { message_id: message.message_id, allow_sending_without_reply: true },
    })
  const price = parseDealPrice(message.text ?? '')
  if (price === null) {
    await reply('Не понял цену. Ответьте на вопрос выше числом в евро, например 85000.')
    return true
  }

  const client = getWriteClient()
  const by = whoPressed(message.from, message.author_signature || message.chat.title || 'команда')
  try {
    if (!client) throw new Error('Sanity write client not configured')
    await client
      .patch(lead._id)
      .set({ dealPrice: price, dealCurrency: 'EUR', dealPriceAt: new Date().toISOString(), dealPriceBy: by })
      .commit()
  } catch (err) {
    console.error('[lead-status] deal price not saved', err instanceof Error ? err.message : err)
    await reply('Не сохранилось, ответьте ещё раз.')
    return true
  }
  await reply(`Записал цену сделки #${leadCode(lead._id)}: ${formatEuro(price)}.`)
  return true
}
