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
 * partner landing) is unique: it goes to that agency only. Everything else -
 * a selection request, a question from an article, the home page, the
 * favourites - is general: every realtor chat gets it, and the message says so.
 */
export type LeadScope = 'unique' | 'general'

/** First line of every lead message in Telegram. */
export function leadScopeLabel(scope: LeadScope): string {
  return scope === 'unique'
    ? '🎯 Уникальная заявка: по конкретному объекту'
    : '📣 Общая заявка: отправлена всем риелторам'
}

const ALL_AGENT_CHATS_TTL_MS = 10 * 60 * 1000
let allAgentChats: { at: number; ids: string[] } | null = null

/** Every agency lead group (`agent.telegramLeadChatId`), cached for ten minutes. */
export async function fetchAllAgentLeadChatIds(): Promise<string[]> {
  if (allAgentChats && Date.now() - allAgentChats.at < ALL_AGENT_CHATS_TTL_MS) return allAgentChats.ids
  const client = getClient()
  if (!client) return []
  try {
    const rows = await client.fetch<Array<string | null>>(
      `*[_type == "agent" && defined(telegramLeadChatId) && !(_id in path("drafts.**"))].telegramLeadChatId`,
      {},
      { cache: 'no-store' } as never,
    )
    const ids = [...new Set((Array.isArray(rows) ? rows : []).map((v) => (typeof v === 'string' ? v.trim() : '')))]
      .filter((v) => /^-?\d{5,20}$/.test(v))
    allAgentChats = { at: Date.now(), ids }
    return ids
  } catch (err) {
    console.error('[leads] agent chats not loaded', err instanceof Error ? err.message : err)
    return allAgentChats?.ids ?? []
  }
}

/**
 * Who a lead goes to and how it is labelled. `listingBound`: the lead names a
 * listing or a partner agency. Unique leads keep the old rule (the agency's
 * group, else the general chat); general leads go to the general chat and to
 * every agency group.
 */
export async function leadAudience(params: {
  listingBound: boolean
  agentChatId?: string | null
  generalChatId?: string
}): Promise<{ scope: LeadScope; chatIds: string[] }> {
  if (params.listingBound) {
    return {
      scope: 'unique',
      chatIds: leadRecipientChatIds({ generalChatId: params.generalChatId, agentChatId: params.agentChatId }),
    }
  }
  const general = leadRecipientChatIds({ generalChatId: params.generalChatId })
  const agents = await fetchAllAgentLeadChatIds()
  return { scope: 'general', chatIds: [...new Set([...general, ...agents])] }
}
