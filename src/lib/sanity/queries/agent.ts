import {
  mapSanityAgentToContactPage,
  type AgentContactPage,
  type SanityAgentDocument,
} from '../agentAdapter';
import { getClient } from './_core';

/** Slug format aligned with property/blog detail routes (safe path segment). */
export const AGENT_SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * Fetch a single `agent` by slug (e.g. for future per-agent flows).
 * Returns null if missing, invalid slug, or on fetch error.
 */
export async function fetchAgentBySlug(
  slug: string,
  locale: string
): Promise<AgentContactPage | null> {
  const client = getClient();
  if (!client) return null;
  const safe = typeof slug === 'string' ? slug.trim() : '';
  if (!safe || !AGENT_SLUG_REGEX.test(safe)) return null;

  const query = `*[_type == "agent" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    isPublished,
    bio,
    email,
    phone,
    photo {
      alt,
      asset-> { url }
    },
    agentLogo {
      alt,
      asset-> { url }
    },
    telegramUrl,
    facebookUrl,
    instagramUrl,
    youtubeUrl
  }`;

  try {
    const result = await client.fetch<SanityAgentDocument | null>(query, { slug: safe });
    return mapSanityAgentToContactPage(result ?? null, locale);
  } catch (err) {
    console.warn('[Sanity] fetchAgentBySlug failed:', err);
    return null;
  }
}



/**
 * The chats of an agency that answers its own leads (owner, 2026-10-22: the
 * Cactus partner landings go to Pavel): phone and telegramUrl from the agent
 * document, only when it has its own Telegram lead group.
 */
export async function fetchAgentMessengerContacts(
  slug: string
): Promise<{ slug: string; phone: string | null; telegramUrl: string | null } | null> {
  const client = getClient();
  if (!client || !AGENT_SLUG_REGEX.test(slug)) return null;
  const doc = await client.fetch<{ slug?: string; phone?: string | null; telegramUrl?: string | null; ownLeads?: boolean } | null>(
    `*[_type == "agent" && slug.current == $slug][0]{ "slug": slug.current, phone, telegramUrl, "ownLeads": defined(telegramLeadChatId) }`,
    { slug },
    { next: { revalidate: 86400, tags: ['sanity:agent'] } } as never,
  );
  if (!doc?.ownLeads || !doc.slug) return null;
  return { slug: doc.slug, phone: doc.phone ?? null, telegramUrl: doc.telegramUrl ?? null };
}
