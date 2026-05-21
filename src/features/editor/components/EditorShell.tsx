'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { EditorProvider, useEditor } from '../state/EditorContext';
import {
  EditableSection,
  AddedSectionPlaceholder,
} from './EditableSection';
import { EditorTopBar } from './EditorTopBar';
import { SectionsPanel, SECTIONS_PANEL_WIDTH } from './SectionsPanel';
import { InspectorPanel, INSPECTOR_PANEL_WIDTH } from './InspectorPanel';
import { AddSectionMenu } from './AddSectionMenu';
import { CanvasInlineEditor } from './CanvasInlineEditor';
import type { EditorSection, ServerSectionNode, SaveResponse } from '../state/types';
import type { Locale } from '../lib/locales';

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'error'; message: string }
  | { kind: 'saved' };

export function EditorShell({
  landingId,
  landingTitle,
  landingSlug,
  pageType,
  initialLocale,
  availableLocales,
  initialSections,
  serverNodesByLocale,
  messagesByLocale,
}: {
  landingId: string;
  landingTitle: string;
  landingSlug?: string;
  pageType?: string;
  initialLocale: Locale;
  availableLocales: readonly Locale[];
  initialSections: EditorSection[];
  serverNodesByLocale: Record<Locale, ServerSectionNode[]>;
  messagesByLocale: Record<Locale, Record<string, unknown>>;
}) {
  return (
    <EditorProvider
      landingId={landingId}
      landingTitle={landingTitle}
      landingSlug={landingSlug}
      pageType={pageType}
      locale={initialLocale}
      availableLocales={availableLocales}
      initialSections={initialSections}
    >
      <EditorShellInner
        serverNodesByLocale={serverNodesByLocale}
        messagesByLocale={messagesByLocale}
      />
    </EditorProvider>
  );
}

function EditorShellInner({
  serverNodesByLocale,
  messagesByLocale,
}: {
  serverNodesByLocale: Record<Locale, ServerSectionNode[]>;
  messagesByLocale: Record<Locale, Record<string, unknown>>;
}) {
  const { state, dispatch, dirty, orderedKeys, pendingAdded, pendingDeleted, pendingChanged } =
    useEditor();
  const router = useRouter();

  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [rightCollapsed, setRightCollapsed] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>({ kind: 'idle' });

  const activeNodes = serverNodesByLocale[state.locale] ?? [];
  const activeMessages = messagesByLocale[state.locale] ?? messagesByLocale.en ?? {};

  const nodeByKey = React.useMemo(() => {
    const m = new Map<string, ServerSectionNode>();
    for (const n of activeNodes) m.set(n.key, n);
    return m;
  }, [activeNodes]);

  const onCanvasClick = React.useCallback(() => {
    dispatch({ type: 'select', key: null });
  }, [dispatch]);

  React.useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  async function onSave() {
    setSaveState({ kind: 'saving' });
    const revalidate = buildRevalidatePaths({
      pageType: state.pageType,
      slug: state.landingSlug,
      locales: state.availableLocales,
    });
    try {
      const res = await fetch('/api/editor/landing/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          landingId: state.landingId,
          order: orderedKeys,
          added: pendingAdded,
          deleted: pendingDeleted,
          changed: pendingChanged,
          revalidate,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as SaveResponse | Record<string, never>;
      if (!res.ok || !('ok' in json) || !json.ok) {
        const msg =
          'reason' in json && typeof json.reason === 'string' ? json.reason : `HTTP ${res.status}`;
        setSaveState({ kind: 'error', message: msg });
        return;
      }
      dispatch({ type: 'commit', nextOriginal: state.draft });
      setSaveState({ kind: 'saved' });
      router.refresh();
      window.setTimeout(() => {
        setSaveState((s) => (s.kind === 'saved' ? { kind: 'idle' } : s));
      }, 2500);
    } catch (err) {
      setSaveState({ kind: 'error', message: (err as Error).message });
    }
  }

  function onCancel() {
    dispatch({ type: 'cancel' });
    setSaveState({ kind: 'idle' });
  }

  const leftGutter = leftCollapsed ? 40 : SECTIONS_PANEL_WIDTH;
  const rightGutter = rightCollapsed ? 40 : INSPECTOR_PANEL_WIDTH;

  return (
    <>
      <EditorTopBar saveState={saveState} onSave={onSave} onCancel={onCancel} />
      <SectionsPanel
        collapsed={leftCollapsed}
        onCollapse={() => setLeftCollapsed((v) => !v)}
        onOpenAdd={() => setAddOpen(true)}
      />
      <InspectorPanel
        collapsed={rightCollapsed}
        onCollapse={() => setRightCollapsed((v) => !v)}
        onOpenAdd={() => setAddOpen(true)}
      />

      <main
        style={{ paddingLeft: leftGutter, paddingRight: rightGutter }}
        className="pt-12"
        onClick={onCanvasClick}
      >
        {/*
          Keying the intl provider on `state.locale` forces client components
          inside section trees (useTranslations / useLocale) to re-mount when
          the editor switches locale, reading the freshly preloaded messages
          bundle without any server round-trip.
        */}
        <NextIntlClientProvider
          key={state.locale}
          locale={state.locale}
          messages={activeMessages}
        >
          <div key={state.locale}>
            {state.draft.map((s) => {
              const node = nodeByKey.get(s._key)?.node;
              const isAdded = state.addedKeys.has(s._key);
              const body =
                isAdded || !node ? (
                  <AddedSectionPlaceholder sectionType={s._type} />
                ) : (
                  node
                );
              return (
                <EditableSection
                  key={s._key}
                  sectionKey={s._key}
                  sectionType={s._type}
                  isAdded={isAdded}
                >
                  {body}
                </EditableSection>
              );
            })}
          </div>
        </NextIntlClientProvider>

        {/* Canvas-side inline editor for simple text fields. */}
        <CanvasInlineEditor />
      </main>

      <AddSectionMenu open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function buildRevalidatePaths({
  pageType,
  slug,
  locales,
}: {
  pageType?: string;
  slug?: string;
  locales: readonly string[];
}): string[] {
  const paths: string[] = [];
  const addFor = (path: string) => {
    for (const loc of locales) paths.push(`/${loc}${path}`);
  };
  if (pageType === 'home' || slug === 'home' || slug === 'landing-home') addFor('');
  if (slug === 'sale' || slug === 'rent' || slug === 'short-term-rent') addFor(`/${slug}`);
  if (slug && paths.length === 0) addFor(`/${slug}`);
  return paths;
}
