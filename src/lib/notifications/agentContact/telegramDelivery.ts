import { formatAgentContactTelegramMessage } from './formatTelegramAgentContact'
import { resolveTelegramBotToken } from './routing'
import { sendTelegramTextMessage } from './telegramBotSend'
import type {
  AgentContactTelegramRouting,
  NormalizedAgentContactSubmission,
  TelegramSendResult,
} from './types'

/**
 * Optional failure injection for manual testing
 * (e.g. TELEGRAM_DEBUG_STUB_FAIL=general | agent | both).
 */
function debugShouldFail(kind: 'general' | 'agent'): boolean {
  const v = process.env.TELEGRAM_DEBUG_STUB_FAIL?.trim().toLowerCase()
  if (!v || v === 'false' || v === '0' || v === 'no') return false
  return v === kind || v === 'both'
}

/**
 * Delivers contact notifications via the Telegram Bot API. Both submission
 * kinds — `'general'` (/contacts form) and `'agent'` (property-page contact
 * modal) — go to the SAME general chat (`TELEGRAM_GENERAL_CHAT_ID`);
 * per-agent chat routing is future work (ids expected from Sanity).
 */
export async function deliverAgentContactTelegram(
  normalized: NormalizedAgentContactSubmission,
  routing: AgentContactTelegramRouting
): Promise<TelegramSendResult> {
  const botToken = resolveTelegramBotToken()
  const chatId = routing.generalChatId

  if (!botToken || !chatId) {
    console.error('[contact-agent] Telegram not configured', {
      kind: normalized.submissionKind,
      hasBotToken: !!botToken,
      hasGeneralChatId: !!chatId,
    })
    return { ok: false, reason: 'Telegram is not configured' }
  }

  if (debugShouldFail(normalized.submissionKind)) {
    console.warn(
      `[contact-agent] TELEGRAM_DEBUG_STUB_FAIL=${normalized.submissionKind} — skipping real send`
    )
    return { ok: false, reason: `debug failure (${normalized.submissionKind})` }
  }

  const text = formatAgentContactTelegramMessage(normalized)

  console.log('[contact-agent] sending Telegram', {
    kind: normalized.submissionKind,
    chatIdLength: chatId.length,
    textLength: text.length,
  })

  return sendTelegramTextMessage({ botToken, chatId, text })
}
