import 'server-only'

import { getClient } from '@/lib/sanity/queries/_core'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { buildLeadDocument, type LeadInput } from './buildLeadDocument'

export type LeadProperty = {
  id: string
  slug: string
  /** Russian title first (the team reads Russian), then English. */
  title?: string
  agentId?: string
  agentSlug?: string
}

type LocalizedTitle = Partial<Record<'en' | 'ru' | 'uk' | 'sq' | 'it' | 'pl' | 'de', string>> | string | null

/**
 * Looks a listing up by slug for the lead's reference and the Telegram title.
 * Returns `null` when Sanity is not configured, the slug is unknown or the
 * lookup fails — a lead never waits on this to be right.
 */
export async function lookupLeadProperty(slug: string): Promise<LeadProperty | null> {
  const client = getClient()
  if (!client) return null
  try {
    const row = await client.fetch<{
      _id?: string
      title?: LocalizedTitle
      agentId?: string
      agentSlug?: string
    } | null>(
      `*[_type == "property" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
        _id, title, "agentId": agent._ref, "agentSlug": agent->slug.current
      }`,
      { slug }
    )
    if (!row?._id) return null
    const t = row.title
    const title = typeof t === 'string' ? t : t?.ru || t?.en || undefined
    return {
      id: row._id,
      slug,
      ...(title ? { title: title.slice(0, 200) } : {}),
      ...(row.agentId ? { agentId: row.agentId } : {}),
      ...(row.agentSlug ? { agentSlug: row.agentSlug } : {}),
    }
  } catch (err) {
    console.error('[leads] property lookup failed', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Writes a `lead` document. Never throws: a failed write is logged and reported
 * so the caller can still deliver the Telegram notification.
 */
export async function createLead(
  input: Omit<LeadInput, 'property' | 'agent'> & {
    propertySlug?: string
    /** Already looked up by the caller; skips a second query. */
    property?: LeadProperty | null
    /** Text title from the form, used when the lookup has none. */
    propertyTitle?: string
    agentSlug?: string
  }
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const client = getWriteClient()
  if (!client) {
    console.error('[leads] Sanity write client not configured (SANITY_API_TOKEN)')
    return { ok: false, reason: 'Sanity not configured' }
  }
  try {
    const { propertySlug, property: known, propertyTitle, agentSlug, ...rest } = input
    const property = known !== undefined ? known : propertySlug ? await lookupLeadProperty(propertySlug) : null
    const slug = property?.slug ?? propertySlug
    const doc = buildLeadDocument({
      ...rest,
      ...(slug
        ? {
            property: {
              slug,
              ...(property?.id ? { id: property.id } : {}),
              ...(property?.title || propertyTitle ? { title: property?.title || propertyTitle } : {}),
            },
          }
        : {}),
      ...(property?.agentId || agentSlug || property?.agentSlug
        ? {
            agent: {
              ...(property?.agentId ? { id: property.agentId } : {}),
              ...(agentSlug || property?.agentSlug ? { slug: agentSlug || property?.agentSlug } : {}),
            },
          }
        : {}),
    })
    const created = await client.create(doc)
    return { ok: true, id: created._id }
  } catch (err) {
    console.error('[leads] create failed', err instanceof Error ? err.message : err)
    return { ok: false, reason: 'Create failed' }
  }
}
