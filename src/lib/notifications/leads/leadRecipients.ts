import { getClient } from '@/lib/sanity/queries/_core'

/**
 * Where a lead's Telegram message goes.
 *
 * A lead on a listing whose agent has their own group
 * (`agent.telegramLeadChatId` in Sanity) goes to that group only — not to the
 * main group (owner's decision, 2026-10-09: the agency handles its own leads).
 * Every other lead goes to the main group (`TELEGRAM_GENERAL_CHAT_ID`). A
 * partner agency therefore sees its own leads and nobody else's. Same bot for
 * every group (@domlivobot); it only has to be a member. The lead itself is
 * still saved in Sanity either way.
 */
export function leadRecipientChatIds(params: {
  generalChatId?: string
  agentChatId?: string | null
}): string[] {
  const valid = (id: string | null | undefined) => {
    const v = typeof id === 'string' ? id.trim() : ''
    return v && /^-?\d{5,20}$/.test(v) ? v : ''
  }
  const agent = valid(params.agentChatId)
  if (agent) return [agent]
  const general = valid(params.generalChatId)
  return general ? [general] : []
}

/**
 * Who a lead on a listing belongs to. The listing's own agent wins over what
 * the browser sent: catalogue cards and the map window do not carry the agent
 * and send "unassigned", and a page cached before a re-attribution carries the
 * old one. Until 2026-10-14 such a lead on a Cactus flat went to the main
 * group while the saved lead (which looks the listing up) showed "cactus".
 */
export function resolveListingAgent(params: {
  clientAgentSlug: string
  clientAgentName: string
  listing: { agentSlug?: string; agentName?: string } | null
}): { agentSlug: string; agentName: string } {
  const slug = params.listing?.agentSlug?.trim()
  if (!slug) return { agentSlug: params.clientAgentSlug, agentName: params.clientAgentName }
  const sameAgent = slug === params.clientAgentSlug
  const name =
    params.listing?.agentName?.trim() ||
    (sameAgent && params.clientAgentName !== '—' ? params.clientAgentName : '') ||
    '—'
  return { agentSlug: slug, agentName: name }
}

/** The agent's own lead group, looked up by agent slug; null when none is set. */
export async function fetchAgentLeadChatId(agentSlug: string | undefined): Promise<string | null> {
  const slug = agentSlug?.trim()
  if (!slug || slug === '—' || slug === 'unassigned') return null
  const client = getClient()
  if (!client) return null
  try {
    const id = await client.fetch<string | null>(
      `*[_type == "agent" && slug.current == $slug && !(_id in path("drafts.**"))][0].telegramLeadChatId`,
      { slug }
    )
    return typeof id === 'string' && id.trim() ? id.trim() : null
  } catch (err) {
    console.error('[leads] agent chat lookup failed', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Unique or general (owner, 2026-10-22). A lead left on a listing (or on a
 * partner landing) is unique; everything else - a selection request, a
 * question from an article, the home page, the favourites - is general, and
 * the message says which.
 */
export type LeadScope = 'unique' | 'general'

/** First line of every lead message in Telegram. */
export function leadScopeLabel(scope: LeadScope): string {
  return scope === 'unique'
    ? '🎯 Уникальная заявка: по конкретному объекту'
    : '📣 Общая заявка: не по конкретному объекту'
}

/**
 * The agency that receives every lead no other agency group claims (owner,
 * 2026-10-22): Viktor Grinchenko, "Grinchenko Real Estate". Its Sanity
 * `telegramLeadChatId` is his group; until it is set, those leads stay in the
 * general chat only.
 */
export const DEFAULT_LEAD_AGENT_SLUG = 'real-estate-al'

const DEFAULT_CHAT_TTL_MS = 10 * 60 * 1000
let defaultChat: { at: number; id: string | null } | null = null

/** The default agency's lead group, cached for ten minutes. */
export async function fetchDefaultLeadChatId(): Promise<string | null> {
  if (defaultChat && Date.now() - defaultChat.at < DEFAULT_CHAT_TTL_MS) return defaultChat.id
  const id = await fetchAgentLeadChatId(DEFAULT_LEAD_AGENT_SLUG)
  defaultChat = { at: Date.now(), id }
  return id
}

/**
 * Who a lead goes to and how it is labelled. `listingBound`: the lead names a
 * listing or a partner agency.
 *
 * - A listing of an agency with its own group (Cactus): that group only.
 * - Every other lead, on a listing or general: the general chat and the
 *   default agency's group (Viktor). Cactus never gets those, and Viktor never
 *   gets Cactus's.
 */
export async function leadAudience(params: {
  listingBound: boolean
  agentChatId?: string | null
  generalChatId?: string
}): Promise<{ scope: LeadScope; chatIds: string[] }> {
  const scope: LeadScope = params.listingBound ? 'unique' : 'general'
  const defaultChatId = await fetchDefaultLeadChatId()
  const own = leadRecipientChatIds({ agentChatId: params.agentChatId })
  if (params.listingBound && own.length > 0 && own[0] !== defaultChatId) return { scope, chatIds: own }
  const general = leadRecipientChatIds({ generalChatId: params.generalChatId })
  const viktor = leadRecipientChatIds({ agentChatId: defaultChatId })
  return { scope, chatIds: [...new Set([...general, ...viktor])] }
}
