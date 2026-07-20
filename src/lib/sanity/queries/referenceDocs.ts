import { getClient, sanityCache, SANITY_TAGS } from './_core';

type LocalizedField = Record<string, string> | null | undefined;

export type TrackerTimelineEvent = {
  _key?: string;
  date?: string;
  event?: LocalizedField;
  sourceUrl?: string;
};

export type TrackerDoc = {
  _id?: string;
  title?: LocalizedField;
  subject?: LocalizedField;
  currentStatus?: 'onTrack' | 'delayed' | 'blocked' | 'done' | string;
  statusLabel?: LocalizedField;
  statusSummary?: LocalizedField;
  lastCheckedAt?: string;
  timeline?: TrackerTimelineEvent[];
  faq?: unknown[];
  sources?: SourceItemDoc[];
};

export type SourceItemDoc = {
  _key?: string;
  label?: string;
  url?: string;
  publisher?: string;
  date?: string;
};

export type DeveloperDoc = {
  _id?: string;
  name?: string;
  slug?: string;
  tier?: 'green' | 'yellow' | 'red' | string;
  tierNote?: LocalizedField;
  description?: LocalizedField;
  foundedYear?: number;
  revenueNote?: LocalizedField;
  keyProjects?: Array<{ _key?: string; name?: string; location?: LocalizedField; url?: string }>;
  risks?: LocalizedField;
  sources?: SourceItemDoc[];
  lastReviewedAt?: string;
  logo?: { asset?: { url?: string }; alt?: string } | null;
  linkedGuide?: { slug?: string; enabled?: boolean; pageType?: string } | null;
};

const TRACKER_PROJECTION = `{
  _id,
  title,
  subject,
  currentStatus,
  statusLabel,
  statusSummary,
  lastCheckedAt,
  "timeline": timeline[] | order(date desc) { _key, date, event, sourceUrl },
  faq,
  "sources": sources[] { _key, label, url, publisher, date }
}`;

const DEVELOPER_PROJECTION = `{
  _id,
  name,
  "slug": slug.current,
  tier,
  tierNote,
  description,
  foundedYear,
  revenueNote,
  "keyProjects": keyProjects[] { _key, name, location, url },
  risks,
  "sources": sources[] { _key, label, url, publisher, date },
  lastReviewedAt,
  logo { asset-> { url }, alt },
  "linkedGuide": linkedGuide-> { "slug": slug.current, enabled, pageType }
}`;

/** Published `tracker` by document id (for `trackerSection` refs). */
export async function fetchTrackerById(id: string): Promise<TrackerDoc | null> {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  if (!trimmed) return null;
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[_type == "tracker" && _id == $id && isPublished != false][0] ${TRACKER_PROJECTION}`;
      try {
        return await client.fetch<TrackerDoc | null>(query, { id: trimmed });
      } catch (err) {
        console.warn('[Sanity] fetchTrackerById failed:', err);
        return null;
      }
    },
    ['sanity-tracker-by-id-v1', trimmed],
    { revalidate: 60, tags: [SANITY_TAGS.tracker] },
  );
  return cached();
}

/** Published `developer` by document id (for `developerCardSection` / property refs). */
export async function fetchDeveloperById(id: string): Promise<DeveloperDoc | null> {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  if (!trimmed) return null;
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[_type == "developer" && _id == $id && isPublished != false][0] ${DEVELOPER_PROJECTION}`;
      try {
        return await client.fetch<DeveloperDoc | null>(query, { id: trimmed });
      } catch (err) {
        console.warn('[Sanity] fetchDeveloperById failed:', err);
        return null;
      }
    },
    ['sanity-developer-by-id-v1', trimmed],
    { revalidate: 60, tags: [SANITY_TAGS.developer] },
  );
  return cached();
}

/**
 * Developers for `developersRatingSection`: all published, or the given ids
 * (selected mode). Order/grouping is applied by the renderer.
 */
export async function fetchDevelopersForRating(ids?: string[]): Promise<DeveloperDoc[]> {
  const cleanIds = Array.isArray(ids)
    ? ids.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];
  const keyIds = cleanIds.length > 0 ? cleanIds.slice().sort().join(',') : 'all';
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const filter =
        cleanIds.length > 0
          ? `_type == "developer" && isPublished != false && _id in $ids`
          : `_type == "developer" && isPublished != false`;
      const query = `*[${filter}] | order(lastReviewedAt desc) ${DEVELOPER_PROJECTION}`;
      try {
        const rows = await client.fetch<DeveloperDoc[]>(query, { ids: cleanIds });
        return Array.isArray(rows) ? rows : [];
      } catch (err) {
        console.warn('[Sanity] fetchDevelopersForRating failed:', err);
        return [];
      }
    },
    ['sanity-developers-for-rating-v1', keyIds],
    { revalidate: 60, tags: [SANITY_TAGS.developer] },
  );
  return cached();
}
