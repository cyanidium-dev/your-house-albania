/**
 * Normalized agent contact submission after validation (server-side).
 * Used for Telegram formatting and future persistence.
 */
export type NormalizedAgentContactSubmission = {
  agentSlug: string
  /** Display name for notifications; may later be verified server-side. */
  agentName: string
  locale: string
  location: string | undefined
  propertyType: string | undefined
  dealType: string | undefined
  priceRangeLabel: string
  areaRangeLabel: string
  customerName: string
  phone: string
  email: string
  message: string
}

export type TelegramDeliveryTarget = 'general' | 'agent'

/** Resolved routing for Telegram (IDs from env until CMS per-agent mapping exists). */
export type AgentContactTelegramRouting = {
  generalChatId: string | undefined
  /**
   * Single fallback chat for “agent-personal” delivery until per-agent chat IDs
   * are provided from Sanity or another backend mapping.
   */
  agentChatId: string | undefined
}

export type TelegramStubResult = { ok: true } | { ok: false; reason: string }
