/**
 * Per-IP request ceiling for the assistant route.
 *
 * In-memory and therefore per serverless instance: a determined abuser spread
 * across instances gets more than the nominal budget. That is accepted for
 * phase 1 — this exists to stop a stuck client or a casual script from burning
 * the month's budget in an afternoon, not to survive an attack. Move it to a
 * shared store when the traffic justifies the dependency.
 */

import { AI_RATE_LIMIT } from './limits'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Drops expired buckets so the map cannot grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 500) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitVerdict = {
  allowed: boolean
  /** Seconds until the caller may retry. Only meaningful when blocked. */
  retryAfterSec: number
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitVerdict {
  sweep(now)
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + AI_RATE_LIMIT.windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (bucket.count >= AI_RATE_LIMIT.requests) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }

  bucket.count += 1
  return { allowed: true, retryAfterSec: 0 }
}

/**
 * Best-effort client identity. Vercel sets `x-forwarded-for`; the first entry is
 * the client. Falls back to a shared bucket, which is intentionally strict —
 * unidentifiable traffic shares one budget.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Test seam: the module keeps state across calls by design. */
export function __resetRateLimit(): void {
  buckets.clear()
}
