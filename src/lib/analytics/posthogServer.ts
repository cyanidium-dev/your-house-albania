/**
 * Server-side PostHog events for leads that never touch the browser: a Start
 * in the public Telegram bot (`telegram_start`). One plain request to the
 * capture endpoint, no SDK.
 *
 * Nothing about the person is sent. The distinct id is random per event and
 * `$process_person_profile: false` keeps PostHog from building a profile, so
 * these count conversions by placement and listing; they cannot be joined to
 * the visitor's browser funnel (Telegram does not pass the site session on).
 * The Telegram account stays in the Sanity lead, where the team needs it.
 */

import { analyticsEnabled } from './config'
import { POSTHOG_HOST, POSTHOG_KEY } from './posthog'

const TIMEOUT_MS = 2000

export type ServerCaptureBody = {
  api_key: string
  event: string
  distinct_id: string
  timestamp: string
  properties: Record<string, unknown>
}

export function buildServerCapture(
  event: string,
  properties: Record<string, unknown>,
  opts: { apiKey: string; distinctId: string; now: Date },
): ServerCaptureBody {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null && value !== '') clean[key] = value
  }
  return {
    api_key: opts.apiKey,
    event,
    distinct_id: opts.distinctId,
    timestamp: opts.now.toISOString(),
    properties: { ...clean, $process_person_profile: false, $lib: 'domlivo-server' },
  }
}

/** Best effort: never throws and gives up after 2 s so a bot reply is not held up. */
export async function capturePostHogServer(event: string, properties: Record<string, unknown>): Promise<void> {
  if (!analyticsEnabled || !POSTHOG_KEY) return
  try {
    const body = buildServerCapture(event, properties, {
      apiKey: POSTHOG_KEY,
      distinctId: `server-${crypto.randomUUID()}`,
      now: new Date(),
    })
    await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    // Analytics must never break the bot.
  }
}
