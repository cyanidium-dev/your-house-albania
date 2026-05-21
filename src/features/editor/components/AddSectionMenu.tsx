'use client';

import * as React from 'react';
import {
  ALLOWED_SECTION_TYPES,
  SECTION_LABELS,
  createSectionDefaults,
  type AllowedSectionType,
} from '../lib/sectionDefaults';
import { useEditor } from '../state/EditorContext';

/**
 * Modal chooser for inserting a new section. Position defaults to "after the
 * currently selected section" when one exists, otherwise appends at the end.
 */
export function AddSectionMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useEditor();
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const types = ALLOWED_SECTION_TYPES.filter((t) =>
    q ? t.toLowerCase().includes(q) || SECTION_LABELS[t].toLowerCase().includes(q) : true,
  );

  function addType(type: AllowedSectionType) {
    const section = createSectionDefaults(type);
    const at = state.selectedKey
      ? ({ kind: 'after', key: state.selectedKey } as const)
      : ({ kind: 'end' } as const);
    dispatch({ type: 'add', section, at });
    onClose();
    // Scroll new section into view after the next paint.
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-section-key="${section._key}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const anchorLabel = state.selectedKey
    ? `after selected section`
    : `at the end of the page`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-6 pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Add section</h2>
            <p className="mt-1 text-xs text-neutral-500">Will be inserted {anchorLabel}.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <label className="mt-4 block">
          <span className="sr-only">Filter sections</span>
          <input
            autoFocus
            type="search"
            placeholder="Filter sections…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
          />
        </label>

        <ul className="mt-3 max-h-[60vh] overflow-y-auto rounded-lg border border-neutral-200">
          {types.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => addType(t)}
                className="flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2.5 text-left text-sm transition last:border-b-0 hover:bg-neutral-50"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-neutral-900">
                    {SECTION_LABELS[t]}
                  </span>
                  <span className="truncate font-mono text-[10px] text-neutral-400">{t}</span>
                </span>
                <span className="shrink-0 text-xs text-neutral-400 group-hover:text-neutral-600">
                  Add →
                </span>
              </button>
            </li>
          ))}
          {types.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-neutral-500">No matches.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
