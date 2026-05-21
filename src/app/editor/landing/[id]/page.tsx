import { notFound, redirect } from 'next/navigation';
import { getEditorSession } from '@/features/editor/auth/getEditorSession';
import { fetchLandingForEditor } from '@/features/editor/data/fetchLandingForEditor';
import { renderLandingSection } from '@/components/landing/sectionRenderers/registry';
import { EditorShell } from '@/features/editor/components/EditorShell';
import { EDITOR_LOCALES, coerceLocale, type Locale } from '@/features/editor/lib/locales';
import type { EditorSection, ServerSectionNode } from '@/features/editor/state/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
}

export default async function EditorLandingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const initialLocale = coerceLocale(sp.locale, 'en');

  const session = await getEditorSession();
  if (!session.authenticated) {
    redirect(
      `/editor/login?next=${encodeURIComponent(`/editor/landing/${id}`)}`,
    );
  }

  const landing = await fetchLandingForEditor(id);
  if (!landing) notFound();

  const rawSections = Array.isArray(landing.pageSections) ? landing.pageSections : [];

  // Shape the raw sections once. Locale doesn't affect structure — only text
  // content inside localized value objects that ship verbatim in `draft`.
  const initialSections: EditorSection[] = [];
  for (const s of rawSections) {
    const key = typeof s?._key === 'string' ? s._key : '';
    const type = typeof s?._type === 'string' ? s._type : 'unknown';
    if (!key) continue;
    initialSections.push({ ...(s as EditorSection), _key: key, _type: type });
  }

  // Preload server-rendered nodes and intl messages for every supported locale.
  // This is editor-only and lets locale switching happen client-side with no
  // navigation or refetch.
  const [serverNodesByLocale, messagesByLocale] = await Promise.all([
    preloadSectionsByLocale(rawSections, EDITOR_LOCALES),
    preloadMessagesByLocale(EDITOR_LOCALES),
  ]);

  return (
    <EditorShell
      landingId={landing._id}
      landingTitle={landing.title ?? landing._id}
      landingSlug={landing.slug}
      pageType={landing.pageType}
      initialLocale={initialLocale}
      availableLocales={EDITOR_LOCALES}
      initialSections={initialSections}
      serverNodesByLocale={serverNodesByLocale}
      messagesByLocale={messagesByLocale}
    />
  );
}

async function preloadSectionsByLocale(
  rawSections: Array<{ _key?: string; _type?: string; [field: string]: unknown }>,
  locales: readonly Locale[],
): Promise<Record<Locale, ServerSectionNode[]>> {
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const nodes: ServerSectionNode[] = [];
      for (const s of rawSections) {
        const key = typeof s?._key === 'string' ? s._key : '';
        const type = typeof s?._type === 'string' ? s._type : 'unknown';
        if (!key) continue;
        let node: React.ReactNode = null;
        try {
          node = await renderLandingSection({ locale, section: s as never });
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[editor] section render failed', { locale, key, type, err });
          }
        }
        nodes.push({ key, type, node });
      }
      return [locale, nodes] as const;
    }),
  );
  const out = {} as Record<Locale, ServerSectionNode[]>;
  for (const [locale, nodes] of entries) out[locale] = nodes;
  return out;
}

async function preloadMessagesByLocale(
  locales: readonly Locale[],
): Promise<Record<Locale, Record<string, unknown>>> {
  const entries = await Promise.all(
    locales.map(async (locale) => {
      let messages: Record<string, unknown>;
      try {
        messages = (await import(`../../../../../messages/${locale}.json`)).default;
      } catch {
        messages = (await import(`../../../../../messages/en.json`)).default;
      }
      return [locale, messages] as const;
    }),
  );
  const out = {} as Record<Locale, Record<string, unknown>>;
  for (const [locale, messages] of entries) out[locale] = messages;
  return out;
}
