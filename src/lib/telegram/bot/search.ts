import 'server-only'

/**
 * Search alerts: a visitor subscribes to a catalogue search by pressing Start
 * on an `s_…` deep link (docs/messenger-leads.md), and the bot sends them the
 * new listings that match it, once a day (`/api/cron/search-alerts`).
 *
 * The subscription is a `searchSubscription` document, read and written with
 * the write token like leads. A listing counts as new when it was created
 * after the subscription and has not been sent yet: partner imports create
 * listings unpublished and publish them later, so "created since" alone would
 * miss those, and "sent slugs" keeps anything from going twice.
 */

import { createHash } from 'node:crypto'
import { messengerPriceLabel } from '@/lib/contacts/messengerContext'
import { formatMoney } from '@/lib/currency/format'
import { propertyPath, type LocalizedSlug } from '@/lib/property/propertyUrl'
import { catalogPath } from '@/lib/routes/catalog'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { getClient } from '@/lib/sanity/queries/_core'
import { buildCatalogWhereClause } from '@/lib/sanity/queries/catalog'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { getSiteBaseUrl } from '@/lib/siteUrl'
import type { SearchFilters } from '@/lib/telegram/startPayload'
import type { CatalogFilters } from '@/types/catalog'
import {
  displayName,
  escapeHtml,
  fill,
  type BotProperty,
  type SearchTexts,
  type SiteLocale,
  type TelegramUser,
} from './format'

/** Active subscriptions one Telegram account may hold; the oldest goes when a sixth arrives. */
const MAX_ACTIVE_PER_USER = 5
/** Listings per alert, newest first; the rest wait for tomorrow. */
export const ALERT_BATCH = 5
/** Sent slugs kept per subscription; also the most one alert run looks at. */
export const SENT_SLUGS_KEPT = 200

export function toCatalogFilters(f: SearchFilters): CatalogFilters {
  return {
    ...(f.city ? { city: f.city } : {}),
    ...(f.cities?.length ? { cities: f.cities } : {}),
    ...(f.district ? { district: f.district } : {}),
    ...(f.type ? { type: f.type } : {}),
    ...(f.types?.length ? { types: f.types } : {}),
    ...(f.deal ? { deal: f.deal } : {}),
    ...(f.stage ? { stage: f.stage } : {}),
    ...(f.minPrice ? { minPrice: f.minPrice } : {}),
    ...(f.maxPrice ? { maxPrice: f.maxPrice } : {}),
    ...(f.minArea ? { minArea: f.minArea } : {}),
    ...(f.maxArea ? { maxArea: f.maxArea } : {}),
    ...(f.beds ? { beds: f.beds } : {}),
    ...(f.bedsExact ? { bedsExact: f.bedsExact } : {}),
    ...(f.nearSea ? { nearSea: true } : {}),
    ...(f.investment ? { investment: true } : {}),
  }
}

/** The same search on the website, newest first, marked as coming from the bot. */
export function searchCatalogUrl(locale: SiteLocale, f: SearchFilters, campaign = 'search-alert'): string {
  const url = new URL(`${getSiteBaseUrl()}${catalogPath(locale, f.city, f.district)}`)
  const q = url.searchParams
  if (f.cities?.length) q.set('cities', f.cities.join(','))
  if (f.type) q.set('type', f.type)
  if (f.types?.length) q.set('types', f.types.join(','))
  if (f.deal) q.set('deal', f.deal)
  if (f.stage) q.set('stage', f.stage)
  if (f.minPrice) q.set('minPrice', String(f.minPrice))
  if (f.maxPrice) q.set('maxPrice', String(f.maxPrice))
  if (f.minArea) q.set('minArea', String(f.minArea))
  if (f.maxArea) q.set('maxArea', String(f.maxArea))
  if (f.beds) q.set('beds', String(f.beds))
  if (f.bedsExact) q.set('bedsExact', String(f.bedsExact))
  if (f.nearSea) q.set('nearSea', '1')
  if (f.investment) q.set('investment', '1')
  q.set('sort', 'newest')
  q.set('utm_source', 'telegram')
  q.set('utm_medium', 'bot')
  q.set('utm_campaign', campaign)
  return url.toString()
}

type NameRow = {
  city?: unknown
  district?: unknown
  type?: unknown
  cities?: unknown[]
  types?: unknown[]
}

function name(value: unknown, locale: SiteLocale, fallback: string): string {
  const s =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object'
        ? resolveLocalizedString(value as Parameters<typeof resolveLocalizedString>[0], locale)
        : ''
  return (s ?? '').trim() || fallback
}

function money(n: number, locale: SiteLocale): string {
  return formatMoney(n, 'EUR', locale)
}

/**
 * The search in words, in the visitor's language: "Apartment · for sale ·
 * Durrës · up to €120,000 · 2+ bedrooms · near the sea". Place and type
 * names come from the CMS; the rest from the bot's texts.
 */
export async function describeSearch(f: SearchFilters, locale: SiteLocale, t: SearchTexts): Promise<string> {
  let names: NameRow = {}
  const client = getClient()
  if (client && (f.city || f.district || f.type || f.cities?.length || f.types?.length)) {
    try {
      names =
        (await client.fetch<NameRow | null>(
          `{
            "city": *[_type == "city" && slug.current == $city][0].title,
            "district": *[_type == "district" && slug.current == $district][0].title,
            "type": *[_type == "propertyType" && slug.current == $type][0].title,
            "cities": *[_type == "city" && slug.current in $cities].title,
            "types": *[_type == "propertyType" && slug.current in $types].title
          }`,
          {
            city: f.city ?? '',
            district: f.district ?? '',
            type: f.type ?? '',
            cities: f.cities ?? [],
            types: f.types ?? [],
          },
        )) ?? {}
    } catch (err) {
      console.error('[telegram-bot] search names failed', err instanceof Error ? err.message : err)
    }
  }
  const parts: string[] = []
  if (f.type) parts.push(name(names.type, locale, f.type))
  else if (f.types?.length) parts.push((names.types?.length ? names.types : f.types).map((v, i) => name(v, locale, f.types![i] ?? '')).join(' / '))
  if (f.deal === 'sale') parts.push(t.dealSale)
  else if (f.deal === 'rent') parts.push(t.dealRent)
  if (f.city) parts.push(name(names.city, locale, f.city))
  else if (f.cities?.length) parts.push((names.cities?.length ? names.cities : f.cities).map((v, i) => name(v, locale, f.cities![i] ?? '')).join(' / '))
  if (f.district) parts.push(name(names.district, locale, f.district))
  if (f.minPrice && f.maxPrice) parts.push(fill(t.priceBetween, { min: money(f.minPrice, locale), max: money(f.maxPrice, locale) }))
  else if (f.minPrice) parts.push(fill(t.priceFrom, { amount: money(f.minPrice, locale) }))
  else if (f.maxPrice) parts.push(fill(t.priceTo, { amount: money(f.maxPrice, locale) }))
  if (f.minArea && f.maxArea) parts.push(fill(t.areaBetween, { min: String(f.minArea), max: String(f.maxArea) }))
  else if (f.minArea) parts.push(fill(t.areaFrom, { n: String(f.minArea) }))
  else if (f.maxArea) parts.push(fill(t.areaTo, { n: String(f.maxArea) }))
  if (f.bedsExact) parts.push(fill(t.bedsExact, { n: String(f.bedsExact) }))
  else if (f.beds) parts.push(fill(t.bedsFrom, { n: String(f.beds) }))
  if (f.stage === 'unfinished') parts.push(t.stageUnfinished)
  else if (f.stage === 'off-plan') parts.push(t.stageOffPlan)
  else if (f.stage === 'under-construction') parts.push(t.stageUnderConstruction)
  else if (f.stage === 'completed') parts.push(t.stageCompleted)
  if (f.nearSea) parts.push(t.nearSea)
  if (f.investment) parts.push(t.investment)
  return parts.length ? parts.join(' · ') : t.anyListing
}

type MatchRow = {
  _id: string
  slug: string
  localizedSlug?: LocalizedSlug
  title?: unknown
  price?: number
  priceUnit?: string
  _createdAt?: string
}

const MATCH_PROJECTION = `{ _id, "slug": slug.current, localizedSlug, title, price, priceUnit, _createdAt }`

/**
 * The newest listings of a search. `since` and `except` make it "what is new
 * for this subscription"; without them it is what the visitor would see at
 * the top of the catalogue right now.
 */
export async function searchMatches(input: {
  filters: SearchFilters
  locale: SiteLocale
  texts: { pricePerSqmFrom: string }
  limit: number
  since?: string
  except?: string[]
  campaign?: string
}): Promise<BotProperty[]> {
  const client = getClient()
  if (!client) return []
  const { where, params } = buildCatalogWhereClause(toCatalogFilters(input.filters))
  const extra = [
    input.since ? 'dateTime(_createdAt) > dateTime($since)' : '',
    input.except?.length ? '!(slug.current in $except)' : '',
  ].filter(Boolean)
  const query = `*[${[where, ...extra].join(' && ')}] | order(_createdAt desc)[0...$limit] ${MATCH_PROJECTION}`
  try {
    const rows = await client.fetch<MatchRow[]>(query, {
      ...params,
      since: input.since ?? '',
      except: input.except ?? [],
      limit: input.limit,
    })
    return (Array.isArray(rows) ? rows : [])
      .filter((r) => r?.slug)
      .map((r) => {
        const url = new URL(`${getSiteBaseUrl()}${propertyPath(input.locale, r.slug, r.localizedSlug)}`)
        url.searchParams.set('utm_source', 'telegram')
        url.searchParams.set('utm_medium', 'bot')
        url.searchParams.set('utm_campaign', input.campaign ?? 'search-alert')
        return {
          slug: r.slug,
          title: name(r.title, input.locale, r.slug).slice(0, 200),
          price: messengerPriceLabel({
            price: r.price,
            priceUnit: r.priceUnit,
            locale: input.locale,
            perSqm: (amount) => fill(input.texts.pricePerSqmFrom, { amount }),
          }),
          url: url.toString(),
        }
      })
  } catch (err) {
    console.error('[telegram-bot] search matches failed', err instanceof Error ? err.message : err)
    return []
  }
}

/** "1. <a>Title</a> — €95,000" lines for a message in HTML mode. */
export function formatMatchLines(items: BotProperty[], priceOnRequest: string): string {
  return items
    .map((p, i) => `${i + 1}. <a href="${escapeHtml(p.url)}">${escapeHtml(p.title)}</a> — ${escapeHtml(p.price || priceOnRequest)}`)
    .join('\n')
}

export function subscriptionId(userId: number, payload: string): string {
  return `searchSubscription-${userId}-${createHash('sha1').update(payload).digest('hex').slice(0, 10)}`
}

export type SearchSubscription = {
  _id: string
  telegramUserId: string
  locale: SiteLocale
  filters: SearchFilters
  summary: string
  catalogUrl: string
  createdAt: string
  sentSlugs?: string[]
  sentCount?: number
}

/**
 * Creates the subscription, or switches it back on when the visitor pressed
 * the same link again. The same search is one document per account, so a
 * second Start never doubles the alerts.
 */
export async function upsertSearchSubscription(input: {
  user: TelegramUser
  locale: SiteLocale
  filters: SearchFilters
  payload: string
  summary: string
  catalogUrl: string
  now: Date
}): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const client = getWriteClient()
  if (!client) return { ok: false, reason: 'Sanity not configured' }
  const id = subscriptionId(input.user.id, input.payload)
  const userId = String(input.user.id)
  try {
    const active = await client.fetch<string[]>(
      `*[_type == "searchSubscription" && telegramUserId == $userId && active == true && _id != $id] | order(createdAt asc)._id`,
      { userId, id },
    )
    const tx = client.transaction()
    for (const old of (active ?? []).slice(0, Math.max(0, (active?.length ?? 0) - (MAX_ACTIVE_PER_USER - 1)))) {
      tx.patch(old, (p) => p.set({ active: false, stoppedAt: input.now.toISOString() }))
    }
    tx.createIfNotExists({
      _id: id,
      _type: 'searchSubscription',
      active: true,
      telegramUserId: userId,
      createdAt: input.now.toISOString(),
      payload: input.payload,
      filters: input.filters,
      sentCount: 0,
      sentSlugs: [],
    })
    tx.patch(id, (p) =>
      p
        .set({
          active: true,
          locale: input.locale,
          summary: input.summary.slice(0, 300),
          catalogUrl: input.catalogUrl,
          name: displayName(input.user),
          ...(input.user.username ? { telegramUsername: input.user.username } : {}),
        })
        .unset(['stoppedAt']),
    )
    await tx.commit({ autoGenerateArrayKeys: true })
    return { ok: true, id }
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error'
    console.error('[telegram-bot] subscription not saved', reason)
    return { ok: false, reason }
  }
}

/** `/stop`: every alert of this account goes off. Returns how many were on. */
export async function stopSearchSubscriptions(userId: number, now: Date): Promise<number> {
  const client = getWriteClient()
  if (!client) return 0
  try {
    const ids = await client.fetch<string[]>(
      `*[_type == "searchSubscription" && telegramUserId == $userId && active == true]._id`,
      { userId: String(userId) },
    )
    if (!ids?.length) return 0
    const tx = client.transaction()
    for (const id of ids) tx.patch(id, (p) => p.set({ active: false, stoppedAt: now.toISOString() }))
    await tx.commit()
    return ids.length
  } catch (err) {
    console.error('[telegram-bot] stop failed', err instanceof Error ? err.message : err)
    return 0
  }
}

export async function activeSearchSubscriptions(): Promise<SearchSubscription[]> {
  const client = getWriteClient()
  if (!client) return []
  try {
    const rows = await client.fetch<SearchSubscription[]>(
      `*[_type == "searchSubscription" && active == true && defined(telegramUserId) && defined(filters)] | order(createdAt asc) {
        _id, telegramUserId, locale, filters, summary, catalogUrl, createdAt, sentSlugs, sentCount
      }`,
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.error('[telegram-bot] subscriptions read failed', err instanceof Error ? err.message : err)
    return []
  }
}

/** After an alert went out: what was sent, so it is never sent again. */
export async function recordAlertSent(sub: SearchSubscription, slugs: string[], now: Date): Promise<void> {
  const client = getWriteClient()
  if (!client) return
  try {
    await client
      .patch(sub._id)
      .set({
        lastSentAt: now.toISOString(),
        sentCount: (sub.sentCount ?? 0) + 1,
        sentSlugs: [...slugs, ...(sub.sentSlugs ?? [])].slice(0, SENT_SLUGS_KEPT),
      })
      .commit()
  } catch (err) {
    console.error('[telegram-bot] alert not recorded', err instanceof Error ? err.message : err)
  }
}

/** The visitor blocked the bot or deleted the account: the alert stops by itself. */
export async function deactivateSubscription(id: string, now: Date, reason: string): Promise<void> {
  const client = getWriteClient()
  if (!client) return
  try {
    await client.patch(id).set({ active: false, stoppedAt: now.toISOString(), stopReason: reason.slice(0, 200) }).commit()
  } catch (err) {
    console.error('[telegram-bot] deactivate failed', err instanceof Error ? err.message : err)
  }
}
