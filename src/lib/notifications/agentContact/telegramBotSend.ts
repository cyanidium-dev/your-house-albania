import type { TelegramStubResult } from './types'

/** Telegram `sendMessage` text limit. */
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096

function telegramApiBase(): string {
  const raw = process.env.TELEGRAM_API_BASE_URL?.trim() || 'https://api.telegram.org'
  return raw.replace(/\/$/, '')
}

/**
 * Sends a plain-text Telegram message via Bot API `sendMessage`.
 * Does not log the bot token. Truncates text if longer than Telegram allows.
 */
export async function sendTelegramTextMessage(params: {
  botToken: string
  chatId: string
  text: string
}): Promise<TelegramStubResult> {
  let textOut = params.text
  if (textOut.length > TELEGRAM_MAX_MESSAGE_LENGTH) {
    const suffix = '\n...[truncated for Telegram]'
    textOut =
      textOut.slice(0, TELEGRAM_MAX_MESSAGE_LENGTH - suffix.length) + suffix
    console.warn('[contact-agent] Telegram message truncated to max length', {
      originalLength: params.text.length,
    })
  }

  const url = `${telegramApiBase()}/bot${params.botToken}/sendMessage`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: textOut,
        disable_web_page_preview: true,
      }),
    })

    const data = (await res.json().catch(() => null)) as {
      ok?: boolean
      description?: string
      error_code?: number
    } | null

    if (!res.ok || !data || data.ok !== true) {
      console.error('[contact-agent] Telegram sendMessage failed', {
        httpStatus: res.status,
        error_code: data?.error_code,
        description: data?.description,
      })
      return { ok: false, reason: 'Telegram API rejected the message' }
    }

    return { ok: true }
  } catch (err) {
    console.error('[contact-agent] Telegram sendMessage network error', err)
    return { ok: false, reason: 'Telegram send failed' }
  }
}
