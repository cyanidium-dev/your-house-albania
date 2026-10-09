import { getClient } from '@/lib/sanity/queries/_core'

/**
 * Where a lead's Telegram message goes.
 *
 * Every lead goes to the main group (`TELEGRAM_GENERAL_CHAT_ID`), which the
 * owner's team watches. A lead on a listing whose agent has their own group
 * (`agent.telegramLeadChatId` in Sanity) goes there too — and only that
 * agent's leads do, so a partner agency never sees another agency's leads.
 * Same bot for every group; the bot only has to be a member.
 */
export function leadRecipientChatIds(params: {
  generalChatId?: string
  agentChatId?: string | null
}): string[] {
  const out: string[] = []
  for (const id of [params.generalChatId, params.agentChatId]) {
    const v = typeof id === 'string' ? id.trim() : ''
    if (v && /^-?\d{5,20}$/.test(v) && !out.includes(v)) out.push(v)
  }
  return out
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
