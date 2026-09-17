/**
 * Abuse guards for `POST /api/leads/click`, which anyone can call and which
 * ends in a Telegram message.
 */

import { createHash } from 'node:crypto'

/** Crawlers, link unfurlers, headless browsers and HTTP libraries. */
const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|curl|wget|python-requests|python-urllib|httpclient|okhttp|go-http-client|node-fetch|axios|postman|insomnia|scrapy|phantomjs|puppeteer|playwright|selenium/i

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim() ?? ''
  return ua.length < 10 || BOT_PATTERN.test(ua)
}

export const CLICK_THROTTLE_MS = 30_000

/**
 * One click lead per client and type per window. The key is a hash, so the map
 * never holds an IP address, and it lives only in this instance's memory.
 * Per instance is enough: it stops a double tap or a script loop from filling
 * the chat, not a determined attacker.
 */
export function createClickThrottle(windowMs = CLICK_THROTTLE_MS) {
  const seen = new Map<string, number>()

  return function allow(clientKey: string, type: string, now: number): boolean {
    if (seen.size > 5000) {
      for (const [k, at] of seen) {
        if (at + windowMs <= now) seen.delete(k)
      }
    }
    const key = createHash('sha256').update(`${clientKey}|${type}`).digest('base64url').slice(0, 24)
    const at = seen.get(key)
    if (at !== undefined && at + windowMs > now) return false
    seen.set(key, now)
    return true
  }
}
