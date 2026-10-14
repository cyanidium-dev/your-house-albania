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
