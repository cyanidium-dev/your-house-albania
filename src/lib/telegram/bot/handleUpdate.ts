import 'server-only'

import { capturePostHogServer } from '@/lib/analytics/posthogServer'
import { createLead } from '@/lib/leads/createLead'
import { isLeadPlacement, type LeadPlacement } from '@/lib/leads/types'
import { resolveAgentContactTelegramRouting } from '@/lib/notifications/agentContact/routing'
import { leadRecipientChatIds } from '@/lib/notifications/leads/leadRecipients'
import { postLeadToTeam } from '@/lib/notifications/leads/postLeadToTeam'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { parseStartPayload, type StartPayload } from '@/lib/telegram/startPayload'
import { botCall, botUserId } from './api'
import { latestBotLead, loadBotTexts, lookupBotListing, type BotListing } from './data'
import { handleDealPriceReply, handleLeadCallback, type TelegramCallbackQuery } from './leadStatus'
import {
  botLocale,
  displayName,
  escapeHtml,
  fill,
  formatMessageHeader,
  formatPropertyCard,
  formatStartForTeam,
  greetingText,
  isSiteLocale,
  userIdFromMarker,
  type BotTexts,
  type SiteLocale,
  type TelegramUser,
} from './format'
import {
  describeSearch,
  formatMatchLines,
  searchCatalogUrl,
  searchMatches,
  stopSearchSubscriptions,
  upsertSearchSubscription,
} from './search'

/** The parts of a Telegram `Message` the bot reads. */
export type TelegramMessage = {
  message_id: number
  from?: TelegramUser
  chat: { id: number; type: 'private' | 'group' | 'supergroup' | 'channel' }
  text?: string
  caption?: string
  contact?: { phone_number: string; first_name?: string; user_id?: number }
  photo?: unknown
  video?: unknown
  document?: unknown
  audio?: unknown
  voice?: unknown
  animation?: unknown
  reply_to_message?: TelegramMessage
  /** Channel posts: who wrote it, when the channel signs messages. */
  author_signature?: string
}

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  /** A press on a status button under a lead (src/lib/telegram/bot/leadStatus.ts). */
  callback_query?: TelegramCallbackQuery
  /** A lead channel: the answer to the deal price question. */
  channel_post?: TelegramMessage
}

/** Message kinds that take a caption, so a copy can carry the header itself. */
const CAPTIONED = ['photo', 'video', 'document', 'audio', 'voice', 'animation'] as const

/** A second Start within this window is the same lead (a double tap, a reopened link). */
const REPEAT_START_MS = 30 * 60 * 1000

function teamChats(agentLeadChatId?: string): string[] {
  return leadRecipientChatIds({
    generalChatId: resolveAgentContactTelegramRouting().generalChatId,
    agentChatId: agentLeadChatId,
  })
}

/**
 * Posts to the team chat as the public bot, so a manager's reply comes back to
 * the webhook; with `leadId` the message carries the status buttons. If that
 * bot is not in the chat yet, the delivery bot posts the same text instead:
 * the lead is never lost, only the reply relay and the buttons are.
 */
async function postToTeam(chatIds: string[], html: string, leadId?: string | null): Promise<boolean> {
  if (chatIds.length === 0) {
    console.error('[telegram-bot] no team chat configured (TELEGRAM_GENERAL_CHAT_ID)')
    return false
  }
  const posted = await postLeadToTeam({ chatIds, text: html, parseMode: 'HTML', leadId, viaPublicBot: true })
  return posted.ok
}

function contactKeyboard(label: string) {
  return {
    keyboard: [[{ text: label, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  }
}

async function handleStart(token: string, message: TelegramMessage, user: TelegramUser, rawPayload: string) {
  const payload = parseStartPayload(rawPayload)
  const locale = botLocale(payload?.locale, user.language_code)
  const texts = await loadBotTexts(locale)

  if (payload?.kind === 'search') {
    await handleSearchStart(token, message, user, payload, rawPayload, locale, texts)
    return
  }

  const listing: BotListing | null =
    payload && payload.kind !== 'general' ? await lookupBotListing(payload, locale, texts) : null
  const placement: LeadPlacement = !payload
    ? 'telegram-bot'
    : payload.kind === 'general'
      ? isLeadPlacement(payload.placement)
        ? payload.placement
        : 'page'
      : 'property'

  // The answer first: the visitor is looking at the chat right now.
  const chatId = message.chat.id
  if (listing) {
    const caption = formatPropertyCard(texts, user, listing)
    const markup = { inline_keyboard: [[{ text: texts.openListing, url: listing.url }]] }
    const photo = listing.imageUrl
      ? await botCall(token, 'sendPhoto', {
          chat_id: chatId,
          photo: listing.imageUrl,
          caption,
          parse_mode: 'HTML',
          reply_markup: markup,
        })
      : null
    if (!photo?.ok) {
      await botCall(token, 'sendMessage', {
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML',
        reply_markup: markup,
        link_preview_options: { is_disabled: true },
      })
    }
    await botCall(token, 'sendMessage', {
      chat_id: chatId,
      text: texts.askProperty,
      reply_markup: contactKeyboard(texts.shareContact),
    })
  } else {
    await botCall(token, 'sendMessage', {
      chat_id: chatId,
      text: `${escapeHtml(greetingText(texts, user))}\n\n${escapeHtml(texts.askGeneral)}`,
      parse_mode: 'HTML',
      reply_markup: contactKeyboard(texts.shareContact),
    })
  }

  // A repeated Start on the same listing is not a new lead.
  const previous = await latestBotLead(user.id)
  const repeat =
    previous !== null &&
    Date.now() - new Date(previous.createdAt).getTime() < REPEAT_START_MS &&
    (previous.propertySlug ?? '') === (listing?.slug ?? '') &&
    (previous.placement ?? '') === placement
  if (repeat) return

  const lead = await createLead({
    type: 'telegram_start',
    placement,
    locale,
    ...(listing
      ? {
          propertySlug: listing.slug,
          property: {
            id: listing.id,
            slug: listing.slug,
            title: listing.title,
            ...(listing.agentId ? { agentId: listing.agentId } : {}),
            ...(listing.agentSlug ? { agentSlug: listing.agentSlug } : {}),
            ...(listing.agentLeadChatId ? { agentLeadChatId: listing.agentLeadChatId } : {}),
          },
        }
      : {}),
    contact: { name: displayName(user) },
    telegram: {
      userId: String(user.id),
      ...(user.username ? { username: user.username } : {}),
      ...(user.language_code ? { language: user.language_code.slice(0, 10) } : {}),
    },
    formLabel: rawPayload ? `telegram-bot:${rawPayload}` : 'telegram-bot',
    now: new Date(),
  })
  if (!lead.ok) console.error('[telegram-bot] lead not saved', lead.reason)
  await capturePostHogServer('telegram_start', {
    lead_type: 'telegram_start',
    is_lead: true,
    placement,
    locale,
    site_locale: payload && isSiteLocale(payload.locale) ? payload.locale : undefined,
    property_slug: listing?.slug,
    source: 'telegram-bot',
  })

  await postToTeam(
    teamChats(listing?.agentLeadChatId),
    formatStartForTeam({
      user,
      locale,
      ...(payload && isSiteLocale(payload.locale) ? { siteLocale: payload.locale } : {}),
      placement,
      property: listing,
      ...(payload && payload.kind !== 'general' && !listing
        ? { missingProperty: payload.kind === 'property' ? payload.slug : payload.idKey }
        : {}),
    }),
    lead.ok ? lead.id : null,
  )
}

/**
 * Start on a "new listings for this search" link: the search is saved, the
 * visitor sees what matches today and gets the rest as it appears
 * (`/api/cron/search-alerts`). A lead like any other Start, so the team can
 * answer in the same chat.
 */
async function handleSearchStart(
  token: string,
  message: TelegramMessage,
  user: TelegramUser,
  payload: Extract<StartPayload, { kind: 'search' }>,
  rawPayload: string,
  locale: SiteLocale,
  texts: BotTexts & { pricePerSqmFrom: string },
) {
  const now = new Date()
  const chatId = message.chat.id
  const summary = await describeSearch(payload.filters, locale, texts.search)
  const catalogUrl = searchCatalogUrl(locale, payload.filters)
  const [saved, matches] = await Promise.all([
    upsertSearchSubscription({ user, locale, filters: payload.filters, payload: rawPayload, summary, catalogUrl, now }),
    searchMatches({ filters: payload.filters, locale, texts, limit: 3, campaign: 'search-start' }),
  ])
  if (!saved.ok) console.error('[telegram-bot] subscription not saved', saved.reason)

  const lines = [
    escapeHtml(greetingText(texts, user)),
    '',
    escapeHtml(texts.search.subscribed),
    escapeHtml(fill(texts.search.yourSearch, { summary })),
  ]
  if (matches.length) lines.push('', escapeHtml(texts.search.latest), formatMatchLines(matches, texts.priceOnRequest))
  lines.push('', escapeHtml(texts.search.stopHint))
  await botCall(token, 'sendMessage', {
    chat_id: chatId,
    text: lines.join('\n'),
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [[{ text: texts.search.openSearch, url: catalogUrl }]] },
    link_preview_options: { is_disabled: true },
  })
  await botCall(token, 'sendMessage', {
    chat_id: chatId,
    text: texts.search.askMore,
    reply_markup: contactKeyboard(texts.shareContact),
  })

  // The same search pressed twice within the window is one lead.
  const previous = await latestBotLead(user.id)
  const repeat =
    previous !== null &&
    Date.now() - new Date(previous.createdAt).getTime() < REPEAT_START_MS &&
    !previous.propertySlug &&
    (previous.placement ?? '') === 'catalog'
  if (repeat) return

  const lead = await createLead({
    type: 'telegram_start',
    placement: 'catalog',
    locale,
    contact: { name: displayName(user) },
    telegram: {
      userId: String(user.id),
      ...(user.username ? { username: user.username } : {}),
      ...(user.language_code ? { language: user.language_code.slice(0, 10) } : {}),
    },
    formLabel: `telegram-bot:${rawPayload}`,
    now,
  })
  if (!lead.ok) console.error('[telegram-bot] lead not saved', lead.reason)
  await capturePostHogServer('telegram_start', {
    lead_type: 'telegram_start',
    is_lead: true,
    placement: 'catalog',
    locale,
    site_locale: isSiteLocale(payload.locale) ? payload.locale : undefined,
    search: true,
    source: 'telegram-bot',
  })

  await postToTeam(
    teamChats(),
    formatStartForTeam({
      user,
      locale,
      ...(isSiteLocale(payload.locale) ? { siteLocale: payload.locale } : {}),
      placement: 'catalog',
      search: { summary, url: catalogUrl },
    }),
    lead.ok ? lead.id : null,
  )
}

/** `/stop`: the search alerts go off; nothing else changes. */
async function handleStop(token: string, message: TelegramMessage, user: TelegramUser) {
  const lead = await latestBotLead(user.id)
  const locale: SiteLocale = isSiteLocale(lead?.locale) ? lead.locale : botLocale(null, user.language_code)
  const texts = await loadBotTexts(locale)
  const stopped = await stopSearchSubscriptions(user.id, new Date())
  await botCall(token, 'sendMessage', {
    chat_id: message.chat.id,
    text: stopped > 0 ? texts.search.stopped : texts.search.nothingToStop,
  })
}

/** Anything a visitor sends after Start goes to the team chat with a header. */
async function handleVisitorMessage(token: string, message: TelegramMessage, user: TelegramUser) {
  let lead = await latestBotLead(user.id)
  // Wrote without pressing Start (found the bot by name): that is a lead too.
  // Not without Sanity, where no lead is ever found and every message would
  // greet the visitor again.
  if (!lead && getWriteClient()) {
    await handleStart(token, message, user, '')
    lead = await latestBotLead(user.id)
  }
  const locale: SiteLocale = isSiteLocale(lead?.locale) ? lead.locale : botLocale(null, user.language_code)
  const chats = teamChats(lead?.agentLeadChatId)
  const header = formatMessageHeader({ user, locale, ...(lead?.propertyTitle ? { propertyTitle: lead.propertyTitle } : {}) })

  if (message.contact) {
    const phone = message.contact.phone_number.replace(/[^\d+]/g, '').slice(0, 20)
    await postToTeam(chats, `${header}\n\n📱 Номер: ${escapeHtml(phone.startsWith('+') ? phone : `+${phone}`)}`)
    const texts = await loadBotTexts(locale)
    await botCall(token, 'sendMessage', {
      chat_id: message.chat.id,
      text: texts.contactReceived,
      reply_markup: { remove_keyboard: true },
    })
    return
  }

  if (typeof message.text === 'string') {
    await postToTeam(chats, `${header}\n\n${escapeHtml(message.text.slice(0, 3500))}`)
  } else {
    const captioned = CAPTIONED.some((k) => message[k] !== undefined)
    for (const chatId of chats) {
      if (captioned) {
        const caption = `${header}${message.caption ? `\n\n${escapeHtml(message.caption.slice(0, 800))}` : ''}`
        const copied = await botCall(token, 'copyMessage', {
          chat_id: chatId,
          from_chat_id: message.chat.id,
          message_id: message.message_id,
          caption,
          parse_mode: 'HTML',
        })
        if (!copied.ok) await postToTeam([chatId], `${header}\n\n(вложение — откройте чат с клиентом)`)
      } else {
        // Stickers, locations, video notes take no caption: header, then the copy under it.
        const head = await botCall<{ message_id: number }>(token, 'sendMessage', {
          chat_id: chatId,
          text: header,
          parse_mode: 'HTML',
        })
        await botCall(token, 'copyMessage', {
          chat_id: chatId,
          from_chat_id: message.chat.id,
          message_id: message.message_id,
          ...(head.ok ? { reply_parameters: { message_id: head.result.message_id } } : {}),
        })
      }
    }
  }
  await botCall(token, 'setMessageReaction', {
    chat_id: message.chat.id,
    message_id: message.message_id,
    reaction: [{ type: 'emoji', emoji: '👍' }],
  })
}

/**
 * A manager replied in the team chat to one of the bot's messages about a
 * visitor: the reply goes to that visitor, from the bot. A 👍 on the reply
 * says it was delivered; a warning under it says it was not.
 */
async function handleManagerReply(token: string, message: TelegramMessage) {
  const original = message.reply_to_message
  const visitorId = userIdFromMarker(original?.text ?? original?.caption)
  if (!visitorId) return
  const sent =
    typeof message.text === 'string'
      ? await botCall(token, 'sendMessage', { chat_id: visitorId, text: message.text })
      : await botCall(token, 'copyMessage', {
          chat_id: visitorId,
          from_chat_id: message.chat.id,
          message_id: message.message_id,
        })
  if (sent.ok) {
    await botCall(token, 'setMessageReaction', {
      chat_id: message.chat.id,
      message_id: message.message_id,
      reaction: [{ type: 'emoji', emoji: '👍' }],
    })
  } else {
    await botCall(token, 'sendMessage', {
      chat_id: message.chat.id,
      text: `⚠️ Не доставлено клиенту: ${sent.description}`,
      reply_parameters: { message_id: message.message_id },
    })
  }
}

/** One webhook update. Never throws: Telegram retries anything but a 200. */
export async function handleTelegramUpdate(update: TelegramUpdate, token: string): Promise<void> {
  if (update.callback_query) {
    await handleLeadCallback(token, update.callback_query)
    return
  }
  if (update.channel_post) {
    if (update.channel_post.reply_to_message) await handleDealPriceReply(token, update.channel_post)
    return
  }

  const message = update.message
  const from = message?.from
  if (!message || !from || from.is_bot) return

  if (message.chat.type === 'private') {
    const text = message.text?.trim() ?? ''
    const start = /^\/start(?:@\w+)?(?:\s+(\S+))?/.exec(text)
    if (start) {
      await handleStart(token, message, from, start[1] ?? '')
      return
    }
    if (/^\/stop(?:@\w+)?$/i.test(text)) {
      await handleStop(token, message, from)
      return
    }
    await handleVisitorMessage(token, message, from)
    return
  }

  if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
    const self = botUserId(token)
    if (self && message.reply_to_message?.from?.id === self) {
      // The answer to "price of the deal?" stays in the chat; any other reply goes to the client.
      if (await handleDealPriceReply(token, message)) return
      await handleManagerReply(token, message)
    }
  }
}
