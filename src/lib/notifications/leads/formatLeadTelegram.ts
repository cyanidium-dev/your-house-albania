/**
 * Telegram text for leads: the "Аналитика" block appended to form messages,
 * and the whole message for contact-link clicks.
 *
 * Russian labels — the team reading the chat works in Russian. Plain text: the
 * existing sender uses no `parse_mode`, so nothing needs escaping, and every
 * value has already been capped and stripped of control characters by
 * `parseLeadContext`.
 */

import type { DeviceClass, LeadContext, TouchPoint, TrafficChannel } from '@/lib/leads/context'
import type { ClickLeadType, LeadPlacement } from '@/lib/leads/types'

const CHANNEL_LABEL: Record<TrafficChannel, string> = {
  direct: 'прямой заход',
  organic_search: 'органический поиск',
  paid_search: 'платный поиск',
  ai: 'AI-ассистент',
  social: 'соцсети',
  email: 'email-рассылка',
  referral: 'переход с сайта',
  campaign: 'кампания (UTM)',
}

const DEVICE_LABEL: Record<DeviceClass, string> = {
  mobile: 'телефон',
  tablet: 'планшет',
  desktop: 'компьютер',
}

const PLACEMENT_LABEL: Record<LeadPlacement, string> = {
  header: 'шапка сайта',
  footer: 'подвал сайта',
  property: 'страница объекта',
  'property-card': 'карточка объекта в списке',
  agent: 'блок агента',
  'quick-contact': 'плавающая кнопка связи',
  'contact-page': 'страница контактов',
  'blog-cta': 'блок в статье',
  landing: 'лендинг',
  'register-page': 'страница регистрации',
  page: 'ссылка на странице',
}

const CLICK_HEADLINE: Record<ClickLeadType, string> = {
  click_whatsapp: '🟢 Лид кликнул по WhatsApp',
  click_phone: '📞 Лид кликнул по телефону',
  click_email: '✉️ Лид кликнул по email',
}

/** Paths listed under "pages viewed". */
const MAX_LISTED_PAGES = 8
const MAX_LISTED_PROPERTIES = 5

export const TEST_PREFIX = '[ТЕСТ] '

export function withTestPrefix(text: string, internal: boolean): string {
  return internal ? `${TEST_PREFIX}${text}` : text
}

/** `mm:ss`; minutes keep counting past the hour. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSec) ? totalSec : 0))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

/** `dd.mm.yyyy` in Tirana time, where the business is. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Tirane',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

function sourceMedium(t: TouchPoint): string {
  return `${t.source} / ${t.medium}`
}

function sameSource(a: TouchPoint, b: TouchPoint): boolean {
  return a.source === b.source && a.medium === b.medium && (a.campaign ?? '') === (b.campaign ?? '')
}

export type AnalyticsBlockInput = {
  context?: LeadContext
  /** From `x-vercel-ip-country`. */
  country?: string
  /** Site locale the lead came in on (request body), when the context has none. */
  locale?: string
}

/**
 * The "📊 Аналитика" block. Without a context (an old cached page, or storage
 * and scripts blocked) it says so instead of printing a column of dashes.
 */
export function formatLeadAnalyticsBlock({ context, country, locale }: AnalyticsBlockInput): string {
  const lines = ['📊 Аналитика']
  if (!context) {
    lines.push('Данных о визите нет (старая вкладка или браузер блокирует хранилище).')
    if (country) lines.push(`Страна: ${country}`)
    if (locale) lines.push(`Язык сайта: ${locale.toUpperCase()}`)
    return lines.join('\n')
  }

  const s = context.session
  lines.push(`Источник: ${sourceMedium(s)}`)
  if (s.campaign) lines.push(`Кампания: ${s.campaign}`)
  lines.push(`Канал: ${CHANNEL_LABEL[s.channel]}`)
  if (s.referrerHost && s.referrerHost !== s.source) lines.push(`Реферер: ${s.referrerHost}`)
  if (s.hasGclid) lines.push('Клик Google Ads: да (gclid)')
  lines.push(`Страница входа: ${s.landingPage}`)

  const first = context.firstTouch
  if (first) {
    const differs = !sameSource(first, s)
    const firstDate = formatDate(first.at)
    lines.push(
      differs
        ? `Первый визит: ${firstDate}, ${sourceMedium(first)}${first.campaign ? ` (${first.campaign})` : ''}`
        : `Первый визит: ${firstDate}`
    )
  }

  const listed = context.pagesViewed.slice(-MAX_LISTED_PAGES)
  lines.push(`Просмотрено страниц: ${context.pagesViewedCount}`)
  if (listed.length > 0) {
    if (context.pagesViewed.length > listed.length || context.pagesViewedCount > listed.length) {
      lines.push(`Последние ${listed.length}:`)
    }
    for (const p of listed) lines.push(`• ${p.path}`)
  }

  if (context.propertySlugsViewed.length > 0) {
    const slugs = context.propertySlugsViewed.slice(-MAX_LISTED_PROPERTIES)
    const more = context.propertySlugsViewed.length - slugs.length
    lines.push(`Смотрел объекты: ${slugs.join(', ')}${more > 0 ? ` и ещё ${more}` : ''}`)
  }

  lines.push(`Время на сайте: ${formatDuration(context.timeOnSiteSec)}`)
  if (country) lines.push(`Страна: ${country}`)
  lines.push(`Устройство: ${DEVICE_LABEL[context.device]}`)
  const siteLocale = context.locale || locale
  const lang = [siteLocale ? `сайт ${siteLocale.toUpperCase()}` : '', context.language ? `браузер ${context.language}` : '']
    .filter(Boolean)
    .join(', ')
  if (lang) lines.push(`Язык: ${lang}`)
  return lines.join('\n')
}

/** Appends the analytics block to an existing form message. */
export function appendLeadAnalytics(text: string, input: AnalyticsBlockInput): string {
  return `${text}\n\n${formatLeadAnalyticsBlock(input)}`
}

export type ClickLeadMessageInput = AnalyticsBlockInput & {
  type: ClickLeadType
  placement: LeadPlacement
  property?: { slug: string; title?: string; url: string }
}

export function formatClickLeadTelegram(input: ClickLeadMessageInput): string {
  const lines = [
    withTestPrefix(CLICK_HEADLINE[input.type], input.context?.internal === true),
    '',
    `Где: ${PLACEMENT_LABEL[input.placement]}`,
  ]
  if (input.context?.currentPage) lines.push(`Страница: ${input.context.currentPage}`)
  if (input.property) {
    lines.push(
      input.property.title
        ? `Объект: ${input.property.title} (${input.property.slug})`
        : `Объект: ${input.property.slug}`
    )
    lines.push(input.property.url)
  }
  lines.push('', formatLeadAnalyticsBlock(input))
  return lines.join('\n')
}
