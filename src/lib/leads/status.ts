/**
 * Lead status from the team's Telegram chats (docs: reports/domlivo-leads-funnel.md).
 *
 * Every lead message the public bot posts ends with a status line and carries
 * six buttons; a press writes the status to the `lead` document and rewrites
 * that line. "Сделка ✅" then asks for the deal price, which is what the
 * owner's 1 % is counted from. Pure: Telegram and Sanity calls live in
 * src/lib/telegram/bot/leadStatus.ts. No path aliases here, so
 * `npx tsx scripts/leads-funnel.ts` can import it.
 */

import type { LeadStatus, LeadType } from './types'

export type ButtonStatus = Extract<LeadStatus, 'contacted' | 'viewing' | 'negotiation' | 'won' | 'lost' | 'spam'>

/** The buttons, in two rows of three. `code` is what the callback data carries. */
export const STATUS_BUTTONS: readonly { status: ButtonStatus; code: string; label: string }[] = [
  { status: 'contacted', code: 'c', label: 'Связался' },
  { status: 'viewing', code: 'v', label: 'Просмотр' },
  { status: 'negotiation', code: 'n', label: 'Торг' },
  { status: 'won', code: 'w', label: 'Сделка ✅' },
  { status: 'lost', code: 'l', label: 'Отказ' },
  { status: 'spam', code: 's', label: 'Спам' },
]

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: '🆕 новая',
  contacted: '📞 связался',
  qualified: '🎯 квалифицирован',
  viewing: '👀 просмотр',
  negotiation: '🤝 торг',
  won: '✅ сделка',
  lost: '❌ отказ',
  spam: '🚫 спам',
}

/** Sanity's generated ids (22 base62 characters); never a draft (no dots). */
const LEAD_ID = /^[A-Za-z0-9_-]{8,40}$/

export function isLeadId(v: unknown): v is string {
  return typeof v === 'string' && LEAD_ID.test(v)
}

/** Short number of a lead as a hashtag: Telegram's chat search lists every message with it. */
export function leadCode(id: string): string {
  return `L${id.replace(/[^A-Za-z0-9]/g, '').slice(-6)}`
}

export type LeadCallback = { kind: 'status'; leadId: string; status: ButtonStatus } | { kind: 'open'; leadId: string }

/** `ls:<code>:<lead id>` sets a status, `lo:<lead id>` posts the lead again with its buttons. */
export function statusCallbackData(leadId: string, status: ButtonStatus): string {
  const code = STATUS_BUTTONS.find((b) => b.status === status)?.code ?? 'c'
  return `ls:${code}:${leadId}`
}

export function openCallbackData(leadId: string): string {
  return `lo:${leadId}`
}

export function parseLeadCallback(data: string | undefined): LeadCallback | null {
  if (!data) return null
  const status = /^ls:([a-z]):(.+)$/.exec(data)
  if (status) {
    const button = STATUS_BUTTONS.find((b) => b.code === status[1])
    return button && isLeadId(status[2]) ? { kind: 'status', leadId: status[2], status: button.status } : null
  }
  const open = /^lo:(.+)$/.exec(data)
  return open && isLeadId(open[1]) ? { kind: 'open', leadId: open[1] } : null
}

type InlineKeyboard = { inline_keyboard: { text: string; callback_data: string }[][] }

/** The six buttons; the current status is marked with a dot. */
export function statusKeyboard(leadId: string, current?: string): InlineKeyboard {
  const button = (b: (typeof STATUS_BUTTONS)[number]) => ({
    text: b.status === current ? `• ${b.label}` : b.label,
    callback_data: statusCallbackData(leadId, b.status),
  })
  return { inline_keyboard: [STATUS_BUTTONS.slice(0, 3).map(button), STATUS_BUTTONS.slice(3).map(button)] }
}

/** `dd.mm HH:MM` in Tirana time, where the business is. */
export function formatShortDateTime(d: Date): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Tirane',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .format(d)
      .replace(',', '')
  } catch {
    return d.toISOString().slice(5, 16).replace('T', ' ')
  }
}

/** `dd.mm` in Tirana time. */
export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return formatShortDateTime(d).slice(0, 5)
}

/** "120 000 €". */
export function formatEuro(n: number): string {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`
}

type TelegramPerson = { first_name?: string; last_name?: string; username?: string }

/** "Ivan Petrov (@ivan)" - who pressed a button or wrote the price. */
export function whoPressed(u: TelegramPerson | undefined, fallback = 'команда'): string {
  if (!u) return fallback
  const name = [u.first_name, u.last_name].filter((s) => s && s.trim()).join(' ').trim()
  const at = u.username ? `@${u.username}` : ''
  return (name && at ? `${name} (${at})` : name || at || fallback).slice(0, 80)
}

/** Start of the status block; the last one in a message is the one that is replaced. */
export const STATUS_MARK = '📌 Статус: '

export function statusLine(input: { leadId: string; status: string; by?: string; at?: Date; price?: number }): string {
  const label = STATUS_LABEL[input.status as LeadStatus] ?? input.status
  const who = input.by ? ` - ${input.by}` : ''
  const when = input.at ? `, ${formatShortDateTime(input.at)}` : ''
  const price = input.price ? `, ${formatEuro(input.price)}` : ''
  return `${STATUS_MARK}${label}${price}${who}${when} · #${leadCode(input.leadId)}`
}

/** Telegram's limit for a message text. */
export const MAX_TEXT = 4096

export type MessageEntity = { type: string; offset: number; length: number } & Record<string, unknown>

/**
 * The message with its status block replaced (or added). Entities (bold,
 * links, the profile link of a bot lead) are kept as they were: offsets are
 * UTF-16 like JS strings, and only the tail after the base text changes.
 */
export function withStatusLine(
  text: string,
  entities: MessageEntity[] | undefined,
  line: string,
  max = MAX_TEXT,
): { text: string; entities: MessageEntity[] } {
  const at = text.lastIndexOf(`\n\n${STATUS_MARK}`)
  let base = at >= 0 ? text.slice(0, at) : text.startsWith(STATUS_MARK) ? '' : text
  if (base.length + line.length + 2 > max) base = base.slice(0, Math.max(0, max - line.length - 3))
  const kept = (entities ?? []).filter((e) => e.offset + e.length <= base.length)
  return { text: base ? `${base}\n\n${line}` : line, entities: kept }
}

/** Escapes a status line for an HTML message (names may carry `<` or `&`). */
export function htmlSafe(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// --- Deal price ------------------------------------------------------------

/** Marker of the price question; a reply to that message is the price. */
export function dealMarker(leadId: string): string {
  return `#deal${leadId}`
}

export function leadIdFromDealMarker(text: string | null | undefined): string | null {
  const m = /#deal([A-Za-z0-9_-]{8,40})(?![A-Za-z0-9_-])/.exec(text ?? '')
  return m ? m[1] : null
}

export function dealPricePrompt(leadId: string): string {
  return [
    `💰 Сделка по заявке #${leadCode(leadId)}.`,
    'Ответьте на это сообщение ценой сделки в евро, например 85000.',
    dealMarker(leadId),
  ].join('\n')
}

const MULTIPLIER: [RegExp, number][] = [
  [/(?:k|к|тыс\.?|тысяч[аи]?)$/, 1_000],
  [/(?:m|м|млн\.?|миллиона?|миллионов)$/, 1_000_000],
]

/**
 * A price in euros from what a partner types: "85000", "85 000 €",
 * "85.000", "1,2 млн", "120k". `null` for anything else or an implausible
 * amount (under 1 000 or over 100 million).
 */
export function parseDealPrice(input: string): number | null {
  let s = input
    .toLowerCase()
    .replace(/€|eur(?:o|os)?\b|евро/g, '')
    .replace(/[\s  ']/g, '')
  let mult = 1
  for (const [re, m] of MULTIPLIER) {
    if (re.test(s)) {
      s = s.replace(re, '')
      mult = m
      break
    }
  }
  let value: number
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(s) && mult === 1) value = Number(s.replace(/[.,]/g, ''))
  else if (/^\d+(?:[.,]\d+)?$/.test(s)) value = Number(s.replace(',', '.'))
  else return null
  const euros = Math.round(value * mult)
  return euros >= 1_000 && euros <= 100_000_000 ? euros : null
}

// --- Which chat a lead belongs to -------------------------------------------

export type TelegramPost = { chatId: string; messageId: number }

/**
 * The chat a lead's message goes to: its agent's own group, else the main
 * chat (the same rule as `leadRecipientChatIds`).
 */
export function leadChatId(agentChatId: string | null | undefined, generalChatId: string | undefined): string | null {
  const valid = (id: string | null | undefined) => (id && /^-?\d{5,20}$/.test(id.trim()) ? id.trim() : '')
  return valid(agentChatId) || valid(generalChatId) || null
}

/**
 * A button only acts on a lead of the chat it was pressed in: the bot posted
 * the lead there, or the lead belongs there. Callback data can be forged by
 * a member of one partner's chat; this keeps them off the other's leads.
 */
export function leadBelongsToChat(
  lead: { agentChat?: string | null; posts?: TelegramPost[] | null },
  chatId: string,
  generalChatId: string | undefined,
): boolean {
  if (lead.posts?.some((p) => String(p.chatId) === chatId)) return true
  return leadChatId(lead.agentChat, generalChatId) === chatId
}

// --- A lead posted again (from the weekly list) -------------------------------

export const TYPE_LABEL: Record<LeadType, string> = {
  contact_form: 'форма',
  property_inquiry: 'запрос по объекту',
  agent_contact: 'запрос агенту',
  registration: 'регистрация',
  guide_download: 'PDF-гид',
  click_whatsapp: 'клик WhatsApp',
  click_telegram: 'клик Telegram',
  click_phone: 'клик по телефону',
  click_email: 'клик по email',
  telegram_start: 'бот Telegram',
}

export type LeadCardRow = {
  _id: string
  type: string
  status: string
  createdAt: string
  name?: string
  phone?: string
  email?: string
  message?: string
  telegramUserId?: string
  telegramUsername?: string
  propertyTitle?: string
  propertySlug?: string
  dealPrice?: number
}

/** Who the lead is, in a few words: name, phone, @username, else the listing. */
export function leadWho(l: LeadCardRow): string {
  return (
    l.name ||
    l.phone ||
    (l.telegramUsername ? `@${l.telegramUsername}` : '') ||
    l.propertyTitle ||
    l.propertySlug ||
    ''
  ).slice(0, 60)
}

/**
 * Plain text. A bot lead keeps its `#tg<id>` marker, so "Ответить" on the
 * card still reaches the visitor.
 */
export function formatLeadCard(l: LeadCardRow): string {
  const lines = [`📋 Заявка от ${formatShortDate(l.createdAt)} (${TYPE_LABEL[l.type as LeadType] ?? l.type})`]
  if (l.name) lines.push(`Имя: ${l.name}`)
  if (l.phone) lines.push(`Телефон: ${l.phone}`)
  if (l.email) lines.push(`Email: ${l.email}`)
  if (l.telegramUsername) lines.push(`Telegram: @${l.telegramUsername}`)
  if (l.propertyTitle || l.propertySlug) {
    lines.push(`Объект: ${[l.propertyTitle, l.propertySlug ? `(${l.propertySlug})` : ''].filter(Boolean).join(' ')}`)
  }
  if (l.message) lines.push(`Сообщение: ${l.message.slice(0, 1500)}`)
  if (l.telegramUserId) lines.push(`#tg${l.telegramUserId}`)
  return lines.join('\n')
}
