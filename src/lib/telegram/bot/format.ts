/**
 * Text of the public bot: what the visitor gets, and what the team chat gets.
 * Pure. HTML parse mode (`<b>`, `<a>`), so every value is escaped.
 *
 * Each team message about a visitor ends with `#tg<user id>`. A manager who
 * replies to such a message is answered by the webhook relaying the reply to
 * that visitor; the hashtag also lists the whole conversation in Telegram's
 * chat search.
 */

import { placementLabel } from '@/lib/notifications/leads/formatLeadTelegram'

export type TelegramUser = {
  id: number
  is_bot?: boolean
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

export const SITE_LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de', 'fr'] as const
export type SiteLocale = (typeof SITE_LOCALES)[number]

export function isSiteLocale(v: unknown): v is SiteLocale {
  return typeof v === 'string' && (SITE_LOCALES as readonly string[]).includes(v)
}

/** The language to answer in: the site's (payload), else the Telegram app's, else English. */
export function botLocale(payloadLocale: string | null | undefined, languageCode: string | null | undefined): SiteLocale {
  if (isSiteLocale(payloadLocale)) return payloadLocale
  const app = (languageCode ?? '').toLowerCase().split('-')[0]
  if (isSiteLocale(app)) return app
  // Albanian clients sometimes report Kosovo / Albanian as `sq`; Belarusians mostly read Russian.
  if (app === 'be') return 'ru'
  return 'en'
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** `{name}` placeholders, as in the site's messages. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m))
}

export function displayName(u: TelegramUser): string {
  const name = [u.first_name, u.last_name].filter((s) => s && s.trim()).join(' ').trim()
  return (name || u.username || `id ${u.id}`).slice(0, 80)
}

export function userMarker(userId: number | string): string {
  return `#tg${userId}`
}

/** The visitor a team message is about, from its `#tg<id>` line. */
export function userIdFromMarker(text: string | null | undefined): number | null {
  const m = /#tg(\d{3,20})\b/.exec(text ?? '')
  if (!m) return null
  const id = Number(m[1])
  return Number.isSafeInteger(id) ? id : null
}

/** "<b>Anna Petrova</b> (@anna)" with a link to the profile. */
function whoHtml(u: TelegramUser): string {
  const name = `<a href="tg://user?id=${u.id}">${escapeHtml(displayName(u))}</a>`
  return u.username ? `${name} (@${escapeHtml(u.username)})` : name
}

export type BotProperty = {
  slug: string
  title: string
  /** Formatted in the visitor's locale; empty when there is none. */
  price: string
  url: string
  imageUrl?: string
}

export function formatStartForTeam(input: {
  user: TelegramUser
  locale: SiteLocale
  /** From the payload, when the link came from the site. */
  siteLocale?: string
  placement: string
  property?: BotProperty | null
  /** The payload named a listing the bot could not find. */
  missingProperty?: string
  /** Start on a search-alert link: the visitor now gets new listings for this search. */
  search?: { summary: string; url: string }
  internal?: boolean
}): string {
  const lines = [
    `${input.internal ? '[ТЕСТ] ' : ''}🤖 <b>Лид из Telegram-бота</b> — ${
      input.search ? 'подписался на новые объекты' : 'нажал «Старт»'
    }`,
    '',
    `Кто: ${whoHtml(input.user)}`,
    `Язык: ${input.locale.toUpperCase()}${input.siteLocale ? ' (сайт)' : ''}${
      input.user.language_code ? `, Telegram: ${escapeHtml(input.user.language_code)}` : ''
    }`,
    `Где: ${escapeHtml(placementLabel(input.placement))}`,
  ]
  if (input.property) {
    lines.push(`Объект: <b>${escapeHtml(input.property.title)}</b>${input.property.price ? `, ${escapeHtml(input.property.price)}` : ''}`)
    lines.push(escapeHtml(input.property.url))
  } else if (input.missingProperty) {
    lines.push(`Объект: ${escapeHtml(input.missingProperty)} (не найден на сайте)`)
  }
  if (input.search) {
    lines.push(`Поиск: <b>${escapeHtml(input.search.summary)}</b>`, escapeHtml(input.search.url))
  }
  lines.push(
    '',
    input.user.username
      ? `Ответить: сделайте reply на это сообщение — бот перешлёт ответ клиенту. Или напрямую: https://t.me/${escapeHtml(input.user.username)}`
      : 'Ответить: сделайте reply на это сообщение — бот перешлёт ответ клиенту (у клиента нет @username).',
    userMarker(input.user.id),
  )
  return lines.join('\n')
}

/** The line above a visitor's message in the team chat: "{name}, {locale}, объект {title}". */
export function formatMessageHeader(input: {
  user: TelegramUser
  locale: string
  propertyTitle?: string
}): string {
  const parts = [whoHtml(input.user), input.locale.toUpperCase()]
  if (input.propertyTitle) parts.push(`объект ${escapeHtml(input.propertyTitle)}`)
  return `💬 ${parts.join(', ')}\n${userMarker(input.user.id)}`
}

/** `TelegramBot.search` in messages/*.json: the search-alert flow and the words of a search. */
export type SearchTexts = {
  subscribed: string
  yourSearch: string
  latest: string
  openSearch: string
  stopHint: string
  stopped: string
  nothingToStop: string
  askMore: string
  newListings: string
  anyListing: string
  dealSale: string
  dealRent: string
  priceFrom: string
  priceTo: string
  priceBetween: string
  areaFrom: string
  areaTo: string
  areaBetween: string
  bedsFrom: string
  bedsExact: string
  nearSea: string
  investment: string
  stageUnfinished: string
  stageOffPlan: string
  stageUnderConstruction: string
  stageCompleted: string
}

export type BotTexts = {
  greeting: string
  greetingNoName: string
  aboutProperty: string
  askProperty: string
  askGeneral: string
  shareContact: string
  openListing: string
  priceOnRequest: string
  contactReceived: string
  search: SearchTexts
}

/** Plain text: escape before sending in HTML mode. */
export function greetingText(t: BotTexts, user: TelegramUser): string {
  const first = user.first_name?.trim()
  return first ? fill(t.greeting, { name: first.slice(0, 40) }) : t.greetingNoName
}

/** The listing card under the greeting: photo caption or message text. */
export function formatPropertyCard(t: BotTexts, user: TelegramUser, p: BotProperty): string {
  return [
    escapeHtml(greetingText(t, user)),
    '',
    escapeHtml(t.aboutProperty),
    `<b>${escapeHtml(p.title)}</b>`,
    escapeHtml(p.price || t.priceOnRequest),
  ].join('\n')
}
