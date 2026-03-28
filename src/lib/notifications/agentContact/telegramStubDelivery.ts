import { formatAgentContactTelegramMessage } from './formatTelegramAgentContact'
import type {
  AgentContactTelegramRouting,
  NormalizedAgentContactSubmission,
  TelegramDeliveryTarget,
  TelegramStubResult,
} from './types'

/** Short delay per simulated send so the route mirrors a real async pipeline. */
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
 * Simulates sending one Telegram message. Replace body with `fetch` to Telegram API when ready.
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
 * Builds both messages and runs simulated delivery for general + agent targets.
 * Success only if both complete without failure.
 */
export async function deliverAgentContactTelegramStub(
  normalized: NormalizedAgentContactSubmission,
  routing: AgentContactTelegramRouting
): Promise<TelegramStubResult> {
  const textGeneral = formatAgentContactTelegramMessage('general', normalized)
  const textAgent = formatAgentContactTelegramMessage('agent', normalized)

  console.log('[contact-agent] outgoing Telegram payloads (stub)', {
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

  console.log('[contact-agent] route: both simulated Telegram deliveries succeeded')
  return { ok: true }
}
