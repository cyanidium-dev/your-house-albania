import { formatAgentContactTelegramMessage } from './formatTelegramAgentContact'
import { resolveTelegramBotToken } from './routing'
import { sendTelegramTextMessage } from './telegramBotSend'
import type {
  AgentContactTelegramRouting,
  NormalizedAgentContactSubmission,
  TelegramDeliveryTarget,
  TelegramStubResult,
} from './types'

/** Short delay per simulated send (agent branch stub only). */
const SIMULATED_SEND_MS = 140

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Optional failure injection for manual testing (e.g. TELEGRAM_DEBUG_STUB_FAIL=general).
 */
function debugStubShouldFail(target: TelegramDeliveryTarget): boolean {
  const v = process.env.TELEGRAM_DEBUG_STUB_FAIL?.trim().toLowerCase()
  if (!v || v === 'false' || v === '0' || v === 'no') return false
  return v === target || v === 'both'
}

/**
 * Simulates sending one Telegram message (used for `submissionKind: 'agent'` until real multi-target delivery is implemented).
 */
export async function simulateTelegramSend(params: {
  target: TelegramDeliveryTarget
  chatId: string | undefined
  text: string
}): Promise<TelegramStubResult> {
  const { target, chatId, text } = params

  if (debugStubShouldFail(target)) {
    console.warn(`[contact-agent][telegram-stub] simulated FAILURE (${target})`)
    return { ok: false, reason: `debug stub failure (${target})` }
  }

  await sleep(SIMULATED_SEND_MS)

  console.log(`[contact-agent][telegram-stub] simulated OK (${target})`, {
    target,
    chatId: chatId ?? '(not configured — stub only)',
    textPreview: text.slice(0, 200) + (text.length > 200 ? '…' : ''),
  })

  return { ok: true }
}

/**
 * Delivers contact notifications. **`submissionKind: 'general'`** uses real Telegram Bot API
 * (`sendMessage`) when `TELEGRAM_BOT_TOKEN` and `TELEGRAM_GENERAL_CHAT_ID` are set.
 * **`submissionKind: 'agent'`** still uses the stub for both targets (future work).
 */
export async function deliverAgentContactTelegramStub(
  normalized: NormalizedAgentContactSubmission,
  routing: AgentContactTelegramRouting
): Promise<TelegramStubResult> {
  if (normalized.submissionKind === 'general') {
    const textGeneral = formatAgentContactTelegramMessage('general', normalized)
    const botToken = resolveTelegramBotToken()
    const chatId = routing.generalChatId

    if (!botToken || !chatId) {
      console.error('[contact-agent] Telegram not configured for general contacts', {
        hasBotToken: !!botToken,
        hasGeneralChatId: !!chatId,
      })
      return { ok: false, reason: 'Telegram is not configured' }
    }

    if (debugStubShouldFail('general')) {
      console.warn('[contact-agent] TELEGRAM_DEBUG_STUB_FAIL=general — skipping real send')
      return { ok: false, reason: 'debug stub failure (general)' }
    }

    console.log('[contact-agent] sending Telegram (general contacts)', {
      chatIdLength: chatId.length,
      textLength: textGeneral.length,
    })

    return sendTelegramTextMessage({
      botToken,
      chatId,
      text: textGeneral,
    })
  }

  const textGeneral = formatAgentContactTelegramMessage('general', normalized)
  const textAgent = formatAgentContactTelegramMessage('agent', normalized)

  console.log('[contact-agent] outgoing Telegram payloads (stub, agent submission)', {
    generalChatId: routing.generalChatId ?? '(unset)',
    agentChatId: routing.agentChatId ?? '(unset)',
  })
  console.log('[contact-agent] message [general]\n', textGeneral)
  console.log('[contact-agent] message [agent]\n', textAgent)

  const r1 = await simulateTelegramSend({
    target: 'general',
    chatId: routing.generalChatId,
    text: textGeneral,
  })
  if (!r1.ok) return r1

  const r2 = await simulateTelegramSend({
    target: 'agent',
    chatId: routing.agentChatId,
    text: textAgent,
  })
  if (!r2.ok) return r2

  console.log('[contact-agent] route: both simulated Telegram deliveries succeeded (agent branch)')
  return { ok: true }
}
