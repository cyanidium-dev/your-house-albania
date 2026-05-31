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

