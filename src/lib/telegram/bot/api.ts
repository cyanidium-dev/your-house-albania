import 'server-only'

/**
 * The public bot (`TELEGRAM_PUBLIC_BOT_TOKEN`, @<NEXT_PUBLIC_TELEGRAM_BOT_USERNAME>):
 * the one visitors talk to. Not the delivery bot (`TELEGRAM_BOT_TOKEN`) that
 * posts form leads to the team chat — that one stays as it is.
 */

export function publicBotToken(): string | null {
  return process.env.TELEGRAM_PUBLIC_BOT_TOKEN?.trim() || null
}

export function webhookSecret(): string | null {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null
}

/** The bot's own user id: the part of the token before the colon. */
export function botUserId(token: string): number | null {
  const id = Number(token.split(':')[0])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function apiBase(): string {
  return (process.env.TELEGRAM_API_BASE_URL?.trim() || 'https://api.telegram.org').replace(/\/$/, '')
}

export type BotResult<T = unknown> = { ok: true; result: T } | { ok: false; description: string }

/** One Bot API call. Never throws and never logs the token. */
export async function botCall<T = unknown>(token: string, method: string, body: Record<string, unknown>): Promise<BotResult<T>> {
  try {
    const res = await fetch(`${apiBase()}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null
    if (!res.ok || !data?.ok) {
      const description = data?.description ?? `HTTP ${res.status}`
      console.error(`[telegram-bot] ${method} failed`, description)
      return { ok: false, description }
    }
    return { ok: true, result: data.result as T }
  } catch (err) {
    const description = err instanceof Error ? err.message : 'network error'
    console.error(`[telegram-bot] ${method} error`, description)
    return { ok: false, description }
  }
}
