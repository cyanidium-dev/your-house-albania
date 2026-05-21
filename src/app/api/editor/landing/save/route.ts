import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireEditorSession } from '@/features/editor/auth/getEditorSession';
import { getWriteClient } from '@/lib/sanity/writeClient';
import {
  ALLOWED_SECTION_TYPES,
  type AllowedSectionType,
} from '@/features/editor/lib/sectionDefaults';

type SectionLike = { _key?: string; _type?: string; [field: string]: unknown };

type RawChange = {
  key?: unknown;
  path?: unknown;
  locale?: unknown;
  value?: unknown;
};

type Body = {
  landingId?: unknown;
  order?: unknown;
  added?: unknown;
  deleted?: unknown;
  changed?: unknown;
  revalidate?: unknown;
};

const ALLOWED_LOCALES = new Set(['en', 'ru', 'sq', 'it', 'uk']);
const PATH_SEGMENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function isAllowed(t: unknown): t is AllowedSectionType {
  return typeof t === 'string' && (ALLOWED_SECTION_TYPES as readonly string[]).includes(t);
}

/**
 * Unified landing save endpoint. Atomically applies:
 *  - add: new section bodies (validated against whitelist)
 *  - delete: remove original sections by _key
 *  - reorder: final order of all remaining keys
 *  - changed: per-section localized text patches
 *
 * Content edits are applied as targeted `set({ "pageSections[_key==\"X\"].title.en": value })`
 * patches so that Sanity refs (cities[]->, agents[]->) are never overwritten by
 * client-side dereferenced projections.
 */
export async function POST(req: Request) {
  const authed = await requireEditorSession();
  if (!authed) {
    return NextResponse.json({ ok: false, reason: 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid JSON' }, { status: 400 });
  }

  const landingId = typeof body.landingId === 'string' ? body.landingId.trim() : '';
  if (!landingId) {
    return NextResponse.json({ ok: false, reason: 'Missing landingId' }, { status: 400 });
  }

  // --- order ---
  const order: string[] = [];
  if (!Array.isArray(body.order)) {
    return NextResponse.json({ ok: false, reason: 'Missing order[]' }, { status: 400 });
  }
  for (const k of body.order) {
    if (typeof k !== 'string' || !k.trim()) {
      return NextResponse.json({ ok: false, reason: 'Invalid key in order' }, { status: 400 });
    }
    order.push(k.trim());
  }
  if (new Set(order).size !== order.length) {
    return NextResponse.json({ ok: false, reason: 'Duplicate keys in order' }, { status: 400 });
  }

  // --- deleted ---
  const deleted: string[] = [];
  if (body.deleted !== undefined) {
    if (!Array.isArray(body.deleted)) {
      return NextResponse.json({ ok: false, reason: 'deleted must be an array' }, { status: 400 });
    }
    for (const k of body.deleted) {
      if (typeof k !== 'string' || !k.trim()) {
        return NextResponse.json({ ok: false, reason: 'Invalid deleted key' }, { status: 400 });
      }
      deleted.push(k.trim());
    }
  }

  // --- added ---
  const added: SectionLike[] = [];
  if (body.added !== undefined) {
    if (!Array.isArray(body.added)) {
      return NextResponse.json({ ok: false, reason: 'added must be an array' }, { status: 400 });
    }
    for (const s of body.added) {
      if (!s || typeof s !== 'object') {
        return NextResponse.json({ ok: false, reason: 'Invalid added section' }, { status: 400 });
      }
      const rec = s as SectionLike;
      if (typeof rec._key !== 'string' || !rec._key.trim()) {
        return NextResponse.json({ ok: false, reason: 'Added section missing _key' }, { status: 400 });
      }
      if (!isAllowed(rec._type)) {
        return NextResponse.json(
          { ok: false, reason: `Section type not allowed: ${String(rec._type)}` },
          { status: 400 },
        );
      }
      added.push(rec);
    }
  }

  // --- changed (content patches) ---
  type Change = { key: string; path: string[]; locale: string; value: string };
  const changed: Change[] = [];
  if (body.changed !== undefined) {
    if (!Array.isArray(body.changed)) {
      return NextResponse.json({ ok: false, reason: 'changed must be an array' }, { status: 400 });
    }
    for (const raw of body.changed) {
      if (!raw || typeof raw !== 'object') {
        return NextResponse.json({ ok: false, reason: 'Invalid change entry' }, { status: 400 });
      }
      const c = raw as RawChange;
      if (typeof c.key !== 'string' || !c.key.trim()) {
        return NextResponse.json({ ok: false, reason: 'Change missing key' }, { status: 400 });
      }
      if (!Array.isArray(c.path) || c.path.length === 0) {
        return NextResponse.json({ ok: false, reason: 'Change missing path' }, { status: 400 });
      }
      const segments: string[] = [];
      for (const seg of c.path) {
        if (typeof seg !== 'string' || !PATH_SEGMENT_RE.test(seg)) {
          return NextResponse.json(
            { ok: false, reason: `Invalid path segment: ${String(seg)}` },
            { status: 400 },
          );
        }
        segments.push(seg);
      }
      if (typeof c.locale !== 'string' || !ALLOWED_LOCALES.has(c.locale)) {
        return NextResponse.json(
          { ok: false, reason: `Invalid locale: ${String(c.locale)}` },
          { status: 400 },
        );
      }
      if (typeof c.value !== 'string') {
        return NextResponse.json({ ok: false, reason: 'Change value must be a string' }, { status: 400 });
      }
      changed.push({ key: c.key.trim(), path: segments, locale: c.locale, value: c.value });
    }
  }

  // --- fetch current ---
  const client = getWriteClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, reason: 'Sanity write client not configured' },
      { status: 503 },
    );
  }

  let doc: { _id?: string; _type?: string; pageSections?: SectionLike[] } | null = null;
  try {
    doc = await client.fetch<{ _id?: string; _type?: string; pageSections?: SectionLike[] } | null>(
      '*[_id == $id][0]{ _id, _type, pageSections }',
      { id: landingId },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: `Sanity fetch failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }
  if (!doc) {
    return NextResponse.json({ ok: false, reason: 'Landing not found' }, { status: 404 });
  }
  if (doc._type !== 'landingPage') {
    return NextResponse.json({ ok: false, reason: 'Not a landingPage' }, { status: 400 });
  }

  const currentSections: SectionLike[] = Array.isArray(doc.pageSections) ? doc.pageSections : [];
  const currentKeys = currentSections.map((s) => s?._key).filter((k): k is string => Boolean(k));
  if (currentKeys.length !== currentSections.length) {
    return NextResponse.json(
      { ok: false, reason: 'Some existing sections lack _key; refuse to save' },
      { status: 409 },
    );
  }
  const currentSet = new Set(currentKeys);
  const addedKeys = new Set(added.map((s) => String(s._key)));
  const deletedSet = new Set(deleted);

  // --- cross-validate structure ---
  for (const k of deleted) {
    if (!currentSet.has(k)) {
      return NextResponse.json(
        { ok: false, reason: `Cannot delete unknown key: ${k}` },
        { status: 409 },
      );
    }
    if (addedKeys.has(k)) {
      return NextResponse.json(
        { ok: false, reason: `Key cannot be both added and deleted: ${k}` },
        { status: 400 },
      );
    }
  }
  for (const k of addedKeys) {
    if (currentSet.has(k)) {
      return NextResponse.json(
        { ok: false, reason: `Added key collides with existing section: ${k}` },
        { status: 409 },
      );
    }
  }

  // expected final set of keys after structural ops
  const expected = new Set<string>();
  for (const k of currentKeys) if (!deletedSet.has(k)) expected.add(k);
  for (const k of addedKeys) expected.add(k);

  if (order.length !== expected.size) {
    return NextResponse.json(
      { ok: false, reason: `Order length ${order.length} does not match expected ${expected.size}` },
      { status: 409 },
    );
  }
  for (const k of order) {
    if (!expected.has(k)) {
      return NextResponse.json(
        { ok: false, reason: `Order contains unexpected key: ${k}` },
        { status: 409 },
      );
    }
  }

  // Cross-validate changes: every change must reference a final-state key.
  for (const c of changed) {
    if (!expected.has(c.key)) {
      return NextResponse.json(
        { ok: false, reason: `Change targets unknown or deleted section: ${c.key}` },
        { status: 409 },
      );
    }
  }

  // --- Build final pageSections array for structural patch ---
  const byKey = new Map<string, SectionLike>();
  for (const s of currentSections) if (s?._key && !deletedSet.has(s._key)) byKey.set(s._key, s);
  for (const s of added) byKey.set(String(s._key), s);

  const nextSections: SectionLike[] = [];
  for (const k of order) {
    const s = byKey.get(k);
    if (!s) {
      return NextResponse.json(
        { ok: false, reason: `Internal: key not found while assembling: ${k}` },
        { status: 500 },
      );
    }
    nextSections.push(s);
  }

  // --- Commit structural first, then content patches ---
  try {
    await client
      .patch(landingId)
      .set({ pageSections: nextSections })
      .commit({ autoGenerateArrayKeys: false });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: `Sanity patch failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (changed.length > 0) {
    // Build one scoped set per change. Sanity accepts multiple set() calls
    // per patch; we chain them to apply as a single document revision.
    let p = client.patch(landingId);
    for (const c of changed) {
      const fieldPath = `pageSections[_key=="${escapeKey(c.key)}"].${c.path.join('.')}.${c.locale}`;
      p = p.set({ [fieldPath]: c.value });
    }
    try {
      await p.commit({ autoGenerateArrayKeys: false });
    } catch (err) {
      return NextResponse.json(
        { ok: false, reason: `Sanity content patch failed: ${(err as Error).message}` },
        { status: 502 },
      );
    }
  }

  if (Array.isArray(body.revalidate)) {
    for (const p of body.revalidate) {
      if (typeof p === 'string' && p.startsWith('/')) {
        try {
          revalidatePath(p);
        } catch {
          /* ignore */
        }
      }
    }
  }

  return NextResponse.json({ ok: true, order });
}

/** Defensively escape a Sanity array key used inside a path filter. Keys are
 *  alphanumeric in practice, but we double-quote-escape just in case. */
function escapeKey(key: string): string {
  return key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
