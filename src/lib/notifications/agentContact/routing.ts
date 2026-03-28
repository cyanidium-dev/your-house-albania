import type { AgentContactTelegramRouting } from './types'

/**
 * Reads Telegram routing from environment.
 * Per-agent chat IDs are expected to come from Sanity (or similar) later; until then
 * TELEGRAM_AGENT_CONTACT_CHAT_ID can act as a single “personal” inbox for testing.
 */
export function resolveAgentContactTelegramRouting(): AgentContactTelegramRouting {
  return {
    generalChatId: process.env.TELEGRAM_GENERAL_CHAT_ID?.trim() || undefined,
    agentChatId: process.env.TELEGRAM_AGENT_CONTACT_CHAT_ID?.trim() || undefined,
  }
}
