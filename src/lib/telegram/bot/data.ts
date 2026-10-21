import 'server-only'

import { messengerPriceLabel } from '@/lib/contacts/messengerContext'
import { PROPERTY_SLUG_MATCH, propertyPath, propertySlugParams, type LocalizedSlug } from '@/lib/property/propertyUrl'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { getClient } from '@/lib/sanity/queries/_core'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { getSiteBaseUrl } from '@/lib/siteUrl'
import { propertyIdCandidates, type StartPayload } from '@/lib/telegram/startPayload'
import { fill, type BotProperty, type BotTexts, type SiteLocale } from './format'

/** The bot's texts in a site language (`TelegramBot` in messages/*.json). */
export async function loadBotTexts(locale: SiteLocale): Promise<BotTexts & { pricePerSqmFrom: string }> {
  type Messages = { TelegramBot?: BotTexts; Shared?: { propertyCard?: { pricePerSqmFrom?: string } } }
  const load = async (l: SiteLocale) => (await import(`../../../../messages/${l}.json`)).default as Messages
  let messages = await load(locale)
  if (!messages.TelegramBot) messages = await load('en')
  return {
    ...(messages.TelegramBot as BotTexts),
    pricePerSqmFrom: messages.Shared?.propertyCard?.pricePerSqmFrom ?? 'from {amount} / m²',
  }
}

export type BotListing = BotProperty & {
  id: string
  agentId?: string
  agentSlug?: string
  agentLeadChatId?: string
}

type ListingRow = {
  _id?: string
  slug?: string
  localizedSlug?: LocalizedSlug
  title?: Record<string, string> | string | null
  price?: number | null
  priceUnit?: string | null
  image?: string | null
  agentId?: string
  agentSlug?: string
  agentLeadChatId?: string
}

const LISTING_PROJECTION = `{
  _id, "slug": slug.current, localizedSlug, title, price, priceUnit,
  "image": gallery[0].asset->url,
  "agentId": agent._ref, "agentSlug": agent->slug.current, "agentLeadChatId": agent->telegramLeadChatId
}`

/**
 * The listing a `start` payload names, in the visitor's language, with the
 * address the bot links to (UTM-tagged, so a visit from the chat is
 * attributed to the bot). `null` when it is not (or no longer) on the site.
 */
export async function lookupBotListing(
  payload: Extract<StartPayload, { kind: 'property' | 'propertyId' }>,
  locale: SiteLocale,
  texts: { pricePerSqmFrom: string },
): Promise<BotListing | null> {
  const client = getClient()
  if (!client) return null
  try {
    const row =
      payload.kind === 'property'
        ? await client.fetch<ListingRow | null>(
            `*[_type == "property" && ${PROPERTY_SLUG_MATCH} && !(_id in path("drafts.**"))][0]${LISTING_PROJECTION}`,
            propertySlugParams(payload.slug),
          )
        : await client.fetch<ListingRow | null>(
            `*[_type == "property" && !(_id in path("drafts.**")) && (_id in $ids || string::startsWith(_id, $prefix))] | order(_id asc)[0]${LISTING_PROJECTION}`,
            { ids: propertyIdCandidates(payload.idKey), prefix: propertyIdCandidates(payload.idKey)[0] },
          )
    if (!row?._id || !row.slug) return null
    const title =
      (typeof row.title === 'string' ? row.title : resolveLocalizedString(row.title, locale)).trim() || row.slug
    const url = new URL(`${getSiteBaseUrl()}${propertyPath(locale, row.slug, row.localizedSlug)}`)
    url.searchParams.set('utm_source', 'telegram')
    url.searchParams.set('utm_medium', 'bot')
    url.searchParams.set('utm_campaign', 'start')
    return {
      id: row._id,
      slug: row.slug,
      title: title.slice(0, 200),
      price: messengerPriceLabel({
        price: row.price,
        priceUnit: row.priceUnit,
        locale,
        perSqm: (amount) => fill(texts.pricePerSqmFrom, { amount }),
      }),
      url: url.toString(),
      ...(row.image ? { imageUrl: `${row.image}?w=1000&fit=max&auto=format` } : {}),
      ...(row.agentId ? { agentId: row.agentId } : {}),
      ...(row.agentSlug ? { agentSlug: row.agentSlug } : {}),
      ...(row.agentLeadChatId?.trim() ? { agentLeadChatId: row.agentLeadChatId.trim() } : {}),
    }
  } catch (err) {
    console.error('[telegram-bot] listing lookup failed', err instanceof Error ? err.message : err)
    return null
  }
}

export type BotLeadSummary = {
  id: string
  createdAt: string
  locale?: string
  propertySlug?: string
  propertyTitle?: string
  placement?: string
  /** The listing agent's own lead group, when it has one. */
  agentLeadChatId?: string
}

/**
 * The visitor's latest bot lead, for the header over their messages and for
 * the chat they go to. Read with the write token: leads are never read
 * through the public client.
 */
export async function latestBotLead(userId: number): Promise<BotLeadSummary | null> {
  const client = getWriteClient()
  if (!client) return null
  try {
    const row = await client.fetch<{
      _id: string
      createdAt: string
      locale?: string
      propertySlug?: string
      propertyTitle?: string
      placement?: string
      agentLeadChatId?: string
    } | null>(
      `*[_type == "lead" && type == "telegram_start" && telegramUserId == $id] | order(createdAt desc)[0]{
        _id, createdAt, locale, propertySlug, propertyTitle, placement, "agentLeadChatId": agent->telegramLeadChatId
      }`,
      { id: String(userId) },
    )
    if (!row?._id) return null
    return {
      id: row._id,
      createdAt: row.createdAt,
      ...(row.locale ? { locale: row.locale } : {}),
      ...(row.propertySlug ? { propertySlug: row.propertySlug } : {}),
      ...(row.propertyTitle ? { propertyTitle: row.propertyTitle } : {}),
      ...(row.placement ? { placement: row.placement } : {}),
      ...(row.agentLeadChatId?.trim() ? { agentLeadChatId: row.agentLeadChatId.trim() } : {}),
    }
  } catch (err) {
    console.error('[telegram-bot] lead lookup failed', err instanceof Error ? err.message : err)
    return null
  }
}
