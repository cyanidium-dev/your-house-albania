import { withTestPrefix } from '@/lib/notifications/leads/formatLeadTelegram'
import { leadAudience } from '@/lib/notifications/leads/leadRecipients'
import { postLeadToTeam } from '@/lib/notifications/leads/postLeadToTeam'
import { formatAgentContactTelegramMessage } from './formatTelegramAgentContact'
import { resolveTelegramBotToken } from './routing'
import type {
  AgentContactTelegramRouting,
  NormalizedAgentContactSubmission,
  TelegramSendResult,
} from './types'

/**
 * Optional failure injection for manual testing
 * (e.g. TELEGRAM_DEBUG_STUB_FAIL=general | agent | quote | both).
 */
function debugShouldFail(kind: NormalizedAgentContactSubmission['submissionKind']): boolean {
  const v = process.env.TELEGRAM_DEBUG_STUB_FAIL?.trim().toLowerCase()
  if (!v || v === 'false' || v === '0' || v === 'no') return false
  return v === kind || v === 'both'
}

/**
 * Delivers contact notifications via the Telegram Bot API. Both submission
 * kinds — `'general'` (/contacts form) and `'agent'` (property-page contact
 * modal) — go to the general chat (`TELEGRAM_GENERAL_CHAT_ID`); a lead on a
 * listing whose agent has their own group goes to that group instead.
 */
export async function deliverAgentContactTelegram(
  normalized: NormalizedAgentContactSubmission,
  routing: AgentContactTelegramRouting,
  options: {
    /** Appended after a blank line — the lead's analytics block. */
    appendix?: string
    /** Internal (owner) traffic: the message is prefixed `[ТЕСТ]`. */
    internal?: boolean
    /**
     * The listing agent's own lead group (`agent.telegramLeadChatId`). When
     * set, the lead goes there instead of the general chat.
     */
    agentChatId?: string | null
    /** The lead names a listing or a partner agency: unique, not general. */
    listingBound?: boolean
    /** The saved lead: the message gets its status buttons (`postLeadToTeam`). */
    leadId?: string | null
  } = {}
): Promise<TelegramSendResult> {
  const botToken = resolveTelegramBotToken()
  const { scope, chatIds } = await leadAudience({
    listingBound: options.listingBound === true,
    generalChatId: routing.generalChatId,
    agentChatId: options.agentChatId,
  })
  const chatId = chatIds[0]

  if (!botToken || !chatId) {
    console.error('[contact-agent] Telegram not configured', {
      kind: normalized.submissionKind,
      hasBotToken: !!botToken,
      hasChatId: !!chatId,
    })
    return { ok: false, reason: 'Telegram is not configured' }
  }

  if (debugShouldFail(normalized.submissionKind)) {
    console.warn(
      `[contact-agent] TELEGRAM_DEBUG_STUB_FAIL=${normalized.submissionKind} — skipping real send`
    )
    return { ok: false, reason: `debug failure (${normalized.submissionKind})` }
  }

  const base = formatAgentContactTelegramMessage(normalized)
  const text = withTestPrefix(
    options.appendix ? `${base}\n\n${options.appendix}` : base,
    options.internal === true
  )

  console.log('[contact-agent] sending Telegram', {
    kind: normalized.submissionKind,
    chatIdLength: chatId.length,
    textLength: text.length,
  })

  const posted = await postLeadToTeam({
    chatIds,
    text,
    scope,
    leadId: options.leadId,
    status: options.internal === true ? 'spam' : 'new',
  })
  return posted.ok ? { ok: true } : posted
}
