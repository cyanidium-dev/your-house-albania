import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { SANITY_TAGS, type SanityTag } from '@/lib/sanity/queries/_core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Map a mutated Sanity document `_type` to the cache tag(s) to purge.
 *
 * Each cached fetcher (see `queries/*`) declares every tag it depends on, so
 * purging the mutated document's own `_type` tag transitively busts every
 * fetcher that lists it. Example: editing a `city` → `revalidateTag('sanity:city')`
 * busts catalog filter-options, footer-cities, home and catalog property lists,
 * all of which carry the `city` tag.
 */
const TYPE_TO_TAGS: Record<string, SanityTag[]> = {
  property: [SANITY_TAGS.property],
  propertyType: [SANITY_TAGS.propertyType],
  homePage: [SANITY_TAGS.homePage],
  landingPage: [SANITY_TAGS.landingPage],
  blogPost: [SANITY_TAGS.blogPost],
  blogCategory: [SANITY_TAGS.blogCategory],
  'blog-settings': [SANITY_TAGS.blogSettings],
  city: [SANITY_TAGS.city],
  district: [SANITY_TAGS.district],
  amenity: [SANITY_TAGS.amenity],
  country: [SANITY_TAGS.country],
  catalogSeoPage: [SANITY_TAGS.catalogSeoPage],
  siteSettings: [SANITY_TAGS.siteSettings],
  tracker: [SANITY_TAGS.tracker],
  developer: [SANITY_TAGS.developer],
};

/**
 * Authorize via a shared secret. Accepts either
 *   `Authorization: Bearer <SANITY_REVALIDATE_SECRET>` (recommended Sanity header)
 * or `?secret=<SANITY_REVALIDATE_SECRET>` (manual/local calls).
 * Returns false when the secret env is unset, so the route is disabled by default.
 */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get('secret') === secret;
}

type WebhookBody = { _type?: unknown; _id?: unknown };

/**
 * Sanity revalidation webhook.
 *
 * Configure a GROQ-powered webhook in Sanity (Manage → API → Webhooks) pointing
 * at `POST /api/revalidate/sanity` with a projection that exposes the document
 * type and id: `{ "_type": _type, "_id": _id }`. Authorize it with a custom
 * header `Authorization: Bearer <SANITY_REVALIDATE_SECRET>`.
 *
 * This complements — and does not replace — the path-based `revalidatePath`
 * invalidation the editor save route performs.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: 'Unauthorized' }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid JSON' }, { status: 400 });
  }

  const type = typeof body._type === 'string' ? body._type : '';
  const id = typeof body._id === 'string' ? body._id : undefined;
  if (!type) {
    return NextResponse.json(
      { ok: false, reason: 'Missing _type in payload' },
      { status: 400 },
    );
  }

  const tags = TYPE_TO_TAGS[type];
  if (!tags) {
    // Acknowledge so Sanity does not retry, but signal nothing was purged.
    return NextResponse.json({ ok: true, revalidated: [], type, id, note: 'Unhandled _type' });
  }

  for (const tag of tags) revalidateTag(tag);

  return NextResponse.json({ ok: true, revalidated: tags, type, id });
}
