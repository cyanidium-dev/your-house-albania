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
 * The agent of a listing, by its slug. Card and map enquiry buttons do not
 * know the agent and send "unassigned"; without this a card lead on a Cactus
 * flat skipped the agency's own group (QA 2026-10-11).
 */
export async function fetchPropertyAgent(
  propertySlug: string | undefined
): Promise<{ slug: string; name: string | null } | null> {
  const slug = propertySlug?.trim()
  if (!slug) return null
  const client = getClient()
  if (!client) return null
  try {
    const row = await client.fetch<{ slug?: string | null; name?: string | null } | null>(
      `*[_type == "property" && slug.current == $slug && !(_id in path("drafts.**"))][0].agent->{"slug": slug.current, name}`,
      { slug }
    )
    return row?.slug ? { slug: row.slug, name: row.name ?? null } : null
  } catch (err) {
    console.error('[leads] property agent lookup failed', err instanceof Error ? err.message : err)
    return null
  }
}
