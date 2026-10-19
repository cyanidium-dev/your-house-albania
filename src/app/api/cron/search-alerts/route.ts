import type { NextRequest } from 'next/server'
import { botCall, publicBotToken } from '@/lib/telegram/bot/api'
import { loadBotTexts } from '@/lib/telegram/bot/data'
import { escapeHtml, isSiteLocale, type SiteLocale } from '@/lib/telegram/bot/format'
import {
  ALERT_BATCH,
  SENT_SLUGS_KEPT,
  activeSearchSubscriptions,
  deactivateSubscription,
  formatMatchLines,
  recordAlertSent,
  searchMatches,
} from '@/lib/telegram/bot/search'

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

/** Telegram's wording when the visitor blocked the bot or the account is gone. */
const GONE = /bot was blocked|user is deactivated|chat not found|bot can't initiate/i

/**
 * Daily search alerts (vercel.json): every active `searchSubscription` gets
 * the listings created since it was made and not sent before, newest first,
 * up to ALERT_BATCH per day. See src/lib/telegram/bot/search.ts.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return new Response('Unauthorized', { status: 401 })
  const token = publicBotToken()
  if (!token) return Response.json({ ok: false, reason: 'TELEGRAM_PUBLIC_BOT_TOKEN not set' }, { status: 503 })

  const now = new Date()
  const subscriptions = await activeSearchSubscriptions()
  const textsByLocale = new Map<SiteLocale, Awaited<ReturnType<typeof loadBotTexts>>>()
  let sent = 0
  let stopped = 0
  let failed = 0

  for (const sub of subscriptions) {
    const locale: SiteLocale = isSiteLocale(sub.locale) ? sub.locale : 'en'
    let texts = textsByLocale.get(locale)
    if (!texts) {
      texts = await loadBotTexts(locale)
      textsByLocale.set(locale, texts)
    }
    // Listings arrive in partner batches of a hundred and more, not one a
    // day: the alert shows the newest ALERT_BATCH and the rest counts as
    // sent, so one batch is one message, not a month of drips.
    const fresh = await searchMatches({
      filters: sub.filters,
      locale,
      texts,
      limit: SENT_SLUGS_KEPT,
      since: sub.createdAt,
      except: sub.sentSlugs ?? [],
    })
    if (fresh.length === 0) continue
    const matches = fresh.slice(0, ALERT_BATCH)

    const text = [
      `🔔 <b>${escapeHtml(texts.search.newListings)}</b>`,
      escapeHtml(sub.summary ?? ''),
      '',
      formatMatchLines(matches, texts.priceOnRequest),
      '',
      escapeHtml(texts.search.stopHint),
    ].join('\n')
    const result = await botCall(token, 'sendMessage', {
      chat_id: Number(sub.telegramUserId),
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...(sub.catalogUrl ? { reply_markup: { inline_keyboard: [[{ text: texts.search.openSearch, url: sub.catalogUrl }]] } } : {}),
    })
    if (result.ok) {
      await recordAlertSent(
        sub,
        fresh.map((m) => m.slug),
        now,
      )
      sent++
    } else if (GONE.test(result.description)) {
      await deactivateSubscription(sub._id, now, result.description)
      stopped++
    } else {
      failed++
    }
  }

  return Response.json(
    { ok: true, checked: subscriptions.length, sent, stopped, failed },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
