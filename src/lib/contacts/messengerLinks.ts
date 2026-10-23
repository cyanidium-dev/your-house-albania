/**
 * Messenger links that arrive with something to say.
 *
 * Until 2026-10 a WhatsApp or Telegram button opened an empty chat, and most
 * visitors who clicked never wrote (CONVERSION-ANALYSIS 2026-10-18). Now:
 *
 * - WhatsApp opens with a ready message in the visitor's language naming the
 *   listing, its price and its address (`?text=`). That needs a phone number:
 *   a WhatsApp Business short link (`wa.me/message/<code>`) ignores `text`, so
 *   the number comes from `NEXT_PUBLIC_WHATSAPP_NUMBER` or from a CMS link of
 *   the `wa.me/<number>` form; without one the link stays as it is.
 * - Telegram opens a person: the listing agent's profile, else the business
 *   account. Until 2026-10-23 it opened the public bot with a `start` payload,
 *   but 15 of 17 visitors sent there never pressed Start, and without Start
 *   the bot never learns who they are: the lead was lost (owner's decision,
 *   2026-10-23). The bot stays for search alerts only.
 *
 * Pure: the server builds the hrefs, the messenger sheet finishes them in the
 * browser (adds the page address, the real placement, the desktop variant).
 */

import { BUSINESS_TELEGRAM_URL } from './businessContacts'

/** Telegram usernames: 5–32 of `[A-Za-z0-9_]`, starting with a letter. */
const BOT_USERNAME = /^[A-Za-z][A-Za-z0-9_]{4,31}$/

/** The public bot's username without `@`, or `null` when it is not configured. */
export function telegramBotUsername(raw: string | undefined = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME): string | null {
  const v = (raw ?? '').trim().replace(/^@/, '')
  return BOT_USERNAME.test(v) ? v : null
}

/** Digits only, 8–15 of them (E.164 without `+`), or `null`. */
function phoneDigits(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15 ? digits : null
}

/** The WhatsApp number to write to: the env override, else `null`. */
export function configuredWhatsAppNumber(raw: string | undefined = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER): string | null {
  return phoneDigits(raw)
}

/**
 * The phone number a WhatsApp link opens a chat with: `wa.me/<number>`,
 * `api.whatsapp.com/send?phone=…`, `web.whatsapp.com/send?phone=…`. `null`
 * for a Business short link (`wa.me/message/<code>`) and anything else.
 */
export function whatsAppNumberOf(url: string): string | null {
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'wa.me') {
    const first = u.pathname.split('/').filter(Boolean)[0] ?? ''
    return /^\+?\d+$/.test(first) ? phoneDigits(first) : null
  }
  if (host === 'api.whatsapp.com' || host === 'web.whatsapp.com') return phoneDigits(u.searchParams.get('phone'))
  return null
}

/** The `text` a WhatsApp link already carries, or `''`. */
export function whatsAppTextOf(url: string): string {
  try {
    return new URL(url.trim()).searchParams.get('text') ?? ''
  } catch {
    return ''
  }
}

/**
 * The WhatsApp link with `text` prefilled. Writes to `number` when given, else
 * to the number in `url`; returns `url` unchanged when there is neither.
 */
export function withWhatsAppText(url: string, text: string, number: string | null = null): string {
  const to = number ?? whatsAppNumberOf(url)
  const body = text.trim()
  if (!to) return url
  return body ? `https://wa.me/${to}?text=${encodeURIComponent(body)}` : `https://wa.me/${to}`
}

/** WhatsApp Web for a desktop without the app; `null` when the number is unknown. */
export function whatsAppWebUrl(url: string): string | null {
  const to = whatsAppNumberOf(url)
  if (!to) return null
  const text = whatsAppTextOf(url)
  return `https://web.whatsapp.com/send?phone=${to}${text ? `&text=${encodeURIComponent(text)}` : ''}`
}

export function telegramBotUrl(username: string, payload: string): string {
  return `https://t.me/${username}?start=${payload}`
}

/** The `start` payload of a bot deep link, or `''`. */
export function telegramStartOf(url: string): string {
  try {
    return new URL(url.trim()).searchParams.get('start') ?? ''
  } catch {
    return ''
  }
}

/** The page address as it goes into a message: no query, no fragment. */
export function shareablePageUrl(href: string): string {
  try {
    const u = new URL(href)
    return `${u.origin}${u.pathname}`
  } catch {
    return ''
  }
}

/** `true` for a link to the public bot (`t.me/<bot>`, any payload). */
function isBotLink(url: string, botUsername: string | null): boolean {
  if (!botUsername) return false
  try {
    const u = new URL(url.trim())
    return /^(www\.)?(t|telegram)\.me$/i.test(u.hostname) && u.pathname.replace(/\/+$/, '').toLowerCase() === `/${botUsername.toLowerCase()}`
  } catch {
    return false
  }
}

/**
 * Finishes a messenger href in the browser, at the moment of the click.
 *
 * WhatsApp: a link without a message gets the general one; a message without
 * an address gets the page's. Telegram: a person's profile is kept as it is; a
 * link to the bot (cached pages, old CMS values) becomes the business account.
 */
export function finishMessengerHref(input: {
  key: 'whatsapp' | 'telegram'
  href: string
  locale: string
  placement: string
  pageUrl: string
  /** The listing slug from the page address or `data-property-slug`. */
  propertySlug?: string | null
  /** `''` keeps a link without a message as it is (owners listing a property). */
  generalText: string
  botUsername: string | null
  whatsAppNumber: string | null
  /** The listing agent's own chat: keep its number / profile, never the platform's. */
  agent?: boolean
}): string {
  if (input.key === 'whatsapp') {
    const current = whatsAppTextOf(input.href)
    const base = current || input.generalText
    if (!base) return input.href
    const text = input.pageUrl && !/https?:\/\//.test(base) ? `${base}\n${input.pageUrl}` : base
    const number = input.agent ? whatsAppNumberOf(input.href) : input.whatsAppNumber ?? whatsAppNumberOf(input.href)
    return withWhatsAppText(input.href, text, number)
  }
  if (input.agent) return input.href
  return isBotLink(input.href, input.botUsername) ? BUSINESS_TELEGRAM_URL : input.href
}
