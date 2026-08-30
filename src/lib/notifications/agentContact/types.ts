/**
 * Normalized contact submission after validation (server-side).
 * `submissionKind: 'general'` is used by `/contacts`; `'agent'` by the
 * property-page contact modal (carries the property context below);
 * `'quote'` by the one-field callback widgets (blog CTA and the floating
 * QuickContact), where only a phone number is asked for — every other
 * customer field arrives as an em dash.
 */
export type NormalizedAgentContactSubmission = {
  submissionKind: 'agent' | 'general' | 'quote'
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
  /** Property-page context (agent submissions only). */
  propertySlug?: string
  propertyTitle?: string
  /** Absolute link to the property page, built server-side. */
  propertyUrl?: string
  /** Quote submissions: where the widget was placed, so the operator can call back in context. */
  sourceLabel?: string
  /** Quote submissions: absolute URL of the page the request came from. */
  sourceUrl?: string
}

/** Resolved routing for Telegram (IDs from env until CMS per-agent mapping exists). */
export type AgentContactTelegramRouting = {
  generalChatId: string | undefined
  /**
   * Single fallback chat for “agent-personal” delivery until per-agent chat IDs
   * are provided from Sanity or another backend mapping. Currently unused —
   * every submission goes to the general chat.
   */
  agentChatId: string | undefined
}

export type TelegramSendResult = { ok: true } | { ok: false; reason: string }
