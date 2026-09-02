/**
 * Monthly spend ceiling for the assistant.
 *
 * The per-IP rate limit in `rateLimit.ts` lives in one process's memory, so on
 * a platform that runs several instances it bounds one visitor's enthusiasm,
 * not the month's bill. This does: the counter is a Sanity document, shared by
 * every instance, incremented from the token counts the API actually reports.
 * When the month's estimate passes the ceiling the route stops answering and
 * the chat degrades to the same "unavailable" state as a missing key.
 *
 * This is the second line, not the first. The hard wall is a spend limit on the
 * Anthropic workspace, which no bug on this side can talk its way past — and
 * which cannot be set on the Default Workspace, so the key has to live in a
 * named one. See `docs` in .env.example.
 */

import { getWriteClient } from '@/lib/sanity/writeClient'

/**
 * USD per million tokens for the configured model. These are Claude Sonnet 5's
 * published rates; the 5-minute cache write multiplier matches the TTL set in
 * `prompt.ts`. Changing ANTHROPIC_MODEL means revisiting these — the estimate
 * is only as honest as the numbers in it.
 */
const PRICE_PER_MTOK = {
  input: 2,
  output: 10,
  cacheWrite5m: 2.5,
  cacheRead: 0.2,
} as const

/** Default ceiling in USD when AI_MONTHLY_BUDGET_USD is unset. */
const DEFAULT_BUDGET_USD = 50

export type TurnUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export const EMPTY_USAGE: TurnUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
}

/** Adds one API response's usage into a running total for the turn. */
export function addUsage(total: TurnUsage, next: Partial<TurnUsage>): TurnUsage {
  return {
    inputTokens: total.inputTokens + (next.inputTokens ?? 0),
    outputTokens: total.outputTokens + (next.outputTokens ?? 0),
    cacheReadTokens: total.cacheReadTokens + (next.cacheReadTokens ?? 0),
    cacheWriteTokens: total.cacheWriteTokens + (next.cacheWriteTokens ?? 0),
  }
}

/** USD for a set of token counts, at the rates above. */
export function estimateUsd(usage: TurnUsage): number {
  const perToken = (mtokPrice: number) => mtokPrice / 1_000_000
  return (
    usage.inputTokens * perToken(PRICE_PER_MTOK.input) +
    usage.outputTokens * perToken(PRICE_PER_MTOK.output) +
    usage.cacheReadTokens * perToken(PRICE_PER_MTOK.cacheRead) +
    usage.cacheWriteTokens * perToken(PRICE_PER_MTOK.cacheWrite5m)
  )
}

/**
 * The counter needs the same write token the currency cron uses. Without it
 * there is no shared counter and therefore no ceiling, which is worth saying
 * out loud once per process rather than failing quietly.
 */
let warnedAboutMissingToken = false

function writeClientOrWarn(): ReturnType<typeof getWriteClient> {
  const client = getWriteClient()
  if (!client && !warnedAboutMissingToken) {
    warnedAboutMissingToken = true
    console.warn(
      '[ai] SANITY_WRITE_TOKEN is not set: the monthly spend ceiling is INACTIVE. ' +
        'Set it, or rely on the Anthropic workspace spend limit alone.',
    )
  }
  return client
}

export function monthlyBudgetUsd(): number {
  const raw = Number(process.env.AI_MONTHLY_BUDGET_USD)
  if (Number.isFinite(raw) && raw > 0) return raw
  return DEFAULT_BUDGET_USD
}

/** Document id for a month, e.g. `ai-usage-2026-09`. UTC, so it turns over predictably. */
export function usageDocId(now = new Date()): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `ai-usage-${year}-${month}`
}

/**
 * True when this month's spend is already past the ceiling.
 *
 * Fails open. A Sanity outage should not take the assistant down — the
 * workspace spend limit is still standing behind it, and an unreadable counter
 * is not evidence of overspending.
 */
export async function isBudgetExhausted(now = new Date()): Promise<boolean> {
  const client = writeClientOrWarn()
  if (!client) return false
  try {
    const spent = await client.fetch<number | null>(
      '*[_id == $id][0].estimatedUsd',
      { id: usageDocId(now) },
    )
    if (typeof spent !== 'number' || !Number.isFinite(spent)) return false
    return spent >= monthlyBudgetUsd()
  } catch (err) {
    console.warn('[ai] budget check failed, allowing the turn:', err)
    return false
  }
}

/**
 * Adds one turn to the month's counter. Called once per turn rather than per
 * API hop, so a two-hop answer costs one write.
 *
 * Never throws: a counter that failed to increment is a reporting problem, not
 * a reason to lose an answer the visitor already paid for.
 */
export async function recordUsage(usage: TurnUsage, now = new Date()): Promise<void> {
  const client = writeClientOrWarn()
  if (!client) return
  const id = usageDocId(now)
  const month = id.replace('ai-usage-', '')
  try {
    await client
      .patch(id)
      .setIfMissing({
        _type: 'aiUsageCounter',
        month,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        turns: 0,
        estimatedUsd: 0,
      })
      .inc({
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens,
        cacheWriteTokens: usage.cacheWriteTokens,
        turns: 1,
        estimatedUsd: estimateUsd(usage),
      })
      .set({ updatedAt: now.toISOString() })
      .commit()
  } catch (err) {
    // A patch on a document that does not exist yet fails rather than creating
    // it, so seed it once and let the next turn increment normally.
    try {
      await client.createIfNotExists({
        _id: id,
        _type: 'aiUsageCounter',
        month,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens,
        cacheWriteTokens: usage.cacheWriteTokens,
        turns: 1,
        estimatedUsd: estimateUsd(usage),
        updatedAt: now.toISOString(),
      })
    } catch (createErr) {
      console.warn('[ai] usage counter write failed:', createErr, err)
    }
  }
}
