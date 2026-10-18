import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { publicBotToken, webhookSecret } from '@/lib/telegram/bot/api'
import { handleTelegramUpdate, type TelegramUpdate } from '@/lib/telegram/bot/handleUpdate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// The answer to the visitor, the lead and the team message happen before the
// 200 — Telegram waits, and a slow Sanity write should not cut them short.
export const maxDuration = 30

const ok = () => Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })

function sameSecret(given: string | null, expected: string): boolean {
  if (!given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Webhook of the public Telegram bot (docs/messenger-leads.md). Telegram sends
 * every update with the secret set by `scripts/telegram-set-webhook.ts` in
 * `X-Telegram-Bot-Api-Secret-Token`; anything without it is refused.
 *
 * Always 200 once authenticated, even when handling failed: Telegram retries
 * a failed delivery for hours, and the visitor would get the greeting again.
 */
export async function POST(req: NextRequest) {
  const token = publicBotToken()
  const secret = webhookSecret()
  if (!token || !secret) return new Response('Bot not configured', { status: 503 })
  if (!sameSecret(req.headers.get('x-telegram-bot-api-secret-token'), secret)) {
    return new Response('Forbidden', { status: 401 })
  }

  let update: TelegramUpdate
  try {
    update = (await req.json()) as TelegramUpdate
  } catch {
    return ok()
  }
  try {
    await handleTelegramUpdate(update, token)
  } catch (err) {
    console.error('[telegram-bot] update failed', err instanceof Error ? err.message : err)
  }
  return ok()
}
