'use client';

import * as React from 'react';
import { useEditor } from '../state/EditorContext';
import { SECTION_LABELS, isAllowedSectionType } from '../lib/sectionDefaults';
import { EDITOR_LOCALES, type Locale } from '../lib/locales';
import { SectionContentFields } from './SectionContentFields';

const PANEL_WIDTH_PX = 340;

export function InspectorPanel({
  collapsed,
  onCollapse,
  onOpenAdd,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onOpenAdd: () => void;
}) {
  const { state, dispatch } = useEditor();

  const selected = state.selectedKey
    ? state.draft.find((s) => s._key === state.selectedKey) ?? null
    : null;
  const selectedIndex = selected ? state.draft.findIndex((s) => s._key === selected._key) : -1;
  const selectedAdded = selected ? state.addedKeys.has(selected._key) : false;
  const selectedChanged = selected ? state.changedKeys.has(selected._key) : false;
  const label =
    selected && isAllowedSectionType(selected._type)
      ? SECTION_LABELS[selected._type]
      : selected?._type;

  const handleLocaleChange = React.useCallback(
    (next: Locale) => {
      if (next === state.locale) return;
      dispatch({ type: 'setActiveLocale', locale: next });
    },
    [dispatch, state.locale],
  );

  if (collapsed) {
    return (
      <aside
        className="fixed right-0 top-12 z-40 flex h-[calc(100vh-3rem)] w-10 flex-col items-center border-l border-neutral-200 bg-white/95 py-3 backdrop-blur"
        aria-label="Inspector panel (collapsed)"
      >
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition hover:bg-neutral-100"
          aria-label="Expand inspector"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M10 4l-4 4 4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="fixed right-0 top-12 z-40 flex h-[calc(100vh-3rem)] flex-col border-l border-neutral-200 bg-white/95 backdrop-blur"
      style={{ width: PANEL_WIDTH_PX }}
      aria-label="Inspector panel"
    >
      {/* Sticky section header: name + quick collapse */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
            {selected ? 'Section' : 'Inspector'}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-neutral-900">
              {selected ? label : 'No selection'}
            </span>
            {selectedAdded ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
                NEW
              </span>
            ) : selectedChanged ? (
              <span className="shrink-0 rounded-full bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-800">
                EDITED
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100"
          aria-label="Collapse inspector"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M6 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 1 — Content fields (priority) */}
        <section className="border-b border-neutral-200 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Content
            </div>
            {selected ? (
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                {state.locale}
              </span>
            ) : null}
          </div>
          {!selected ? (
            <EmptyContentHint />
          ) : (
            <SectionContentFields section={selected} />
          )}
        </section>

        {/* 2 — Locale */}
        <section className="border-b border-neutral-200 px-4 py-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Locale
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EDITOR_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleLocaleChange(loc)}
                className={[
                  'inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-wider transition',
                  loc === state.locale
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900',
                ].join(' ')}
              >
                {loc}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">
            Edits apply to the current locale. Switching keeps all draft edits
            and updates the canvas + inspector instantly.
          </p>
        </section>

        {/* 3 — Actions */}
        {selected ? (
          <section className="border-b border-neutral-200 px-4 py-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Actions
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onOpenAdd}
                className="inline-flex h-8 items-center justify-center rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100"
              >
                Add section after this
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(`Delete ${label} section? Save to persist.`)) return;
                  dispatch({ type: 'delete', key: selected._key });
                }}
                className="inline-flex h-8 items-center justify-center rounded-full border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition hover:bg-red-50"
              >
                Delete section
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'select', key: null })}
                className="inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] font-medium text-neutral-500 transition hover:text-neutral-800"
              >
                Clear selection
              </button>
            </div>
          </section>
        ) : null}

        {/* 4 — Advanced (collapsed by default) */}
        <AdvancedPanel
          selected={
            selected
              ? {
                  key: selected._key,
                  type: selected._type,
                  index: selectedIndex,
                  total: state.draft.length,
                  status: selectedAdded ? 'added' : selectedChanged ? 'edited' : 'saved',
                }
              : null
          }
          page={{
            id: state.landingId,
            slug: state.landingSlug,
            pageType: state.pageType,
            title: state.landingTitle,
          }}
        />
      </div>
    </aside>
  );
}

function EmptyContentHint() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-6 text-center text-xs text-neutral-500">
      Click a section on the page or in the left panel to edit its content.
    </div>
  );
}

type AdvancedSelected = {
  key: string;
  type: string;
  index: number;
  total: number;
  status: 'added' | 'edited' | 'saved';
};

function AdvancedPanel({
  selected,
  page,
}: {
  selected: AdvancedSelected | null;
  page: { id: string; slug?: string; pageType?: string; title?: string };
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <section className="px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-400 transition hover:text-neutral-700"
        aria-expanded={open}
      >
        <span>Advanced</span>
        <span aria-hidden className={open ? 'rotate-90 transition' : 'transition'}>
          ›
        </span>
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {selected ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]">
              <dt className="text-neutral-500">Type</dt>
              <dd className="truncate font-mono text-neutral-800">{selected.type}</dd>
              <dt className="text-neutral-500">Index</dt>
              <dd className="text-neutral-800">
                {selected.index + 1} / {selected.total}
              </dd>
              <dt className="text-neutral-500">Key</dt>
              <dd className="truncate font-mono text-[10px] text-neutral-500">{selected.key}</dd>
              <dt className="text-neutral-500">Status</dt>
              <dd className="text-neutral-800">{selected.status}</dd>
            </dl>
          ) : null}
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Page
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]">
              {page.title ? (
                <>
                  <dt className="text-neutral-500">Title</dt>
                  <dd className="truncate text-neutral-800">{page.title}</dd>
                </>
              ) : null}
              {page.pageType ? (
                <>
                  <dt className="text-neutral-500">Type</dt>
                  <dd className="truncate text-neutral-800">{page.pageType}</dd>
                </>
              ) : null}
              {page.slug ? (
                <>
                  <dt className="text-neutral-500">Slug</dt>
                  <dd className="truncate font-mono text-neutral-800">{page.slug}</dd>
                </>
              ) : null}
              <dt className="text-neutral-500">ID</dt>
              <dd className="truncate font-mono text-[10px] text-neutral-500">{page.id}</dd>
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { PANEL_WIDTH_PX as INSPECTOR_PANEL_WIDTH };
