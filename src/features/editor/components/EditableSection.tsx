'use client';

import * as React from 'react';
import { useEditor } from '../state/EditorContext';
import { SECTION_LABELS, isAllowedSectionType } from '../lib/sectionDefaults';

/**
 * Thin wrapper around a rendered section.
 *
 * Does NOT introduce any layout — the child is the section, rendered in real
 * document flow exactly as on the public site. Interactive chrome is purely
 * positioned overlays that do not push content.
 *
 * Behaviors:
 * - click anywhere on the section -> select it
 * - hover -> mark hovered + show subtle outline
 * - selected -> strong outline + floating mini-toolbar (type badge, delete)
 * - all child pointer events are disabled so Links / carousels / videos inside
 *   the real section don't steal the click away from the editor
 */
export function EditableSection({
  sectionKey,
  sectionType,
  isAdded,
  children,
}: {
  sectionKey: string;
  sectionType: string;
  isAdded?: boolean;
  children: React.ReactNode;
}) {
  const { state, dispatch } = useEditor();
  const selected = state.selectedKey === sectionKey;
  const hovered = state.hoveredKey === sectionKey;

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: 'select', key: sectionKey });
    },
    [dispatch, sectionKey],
  );

  const onDelete = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!window.confirm(`Delete this ${sectionType} section? Save to persist.`)) return;
      dispatch({ type: 'delete', key: sectionKey });
    },
    [dispatch, sectionKey, sectionType],
  );

  const friendly = isAllowedSectionType(sectionType) ? SECTION_LABELS[sectionType] : sectionType;

  return (
    <div
      data-section-key={sectionKey}
      data-section-type={sectionType}
      data-selected={selected ? 'true' : undefined}
      className="relative"
      onMouseEnter={() => dispatch({ type: 'hover', key: sectionKey })}
      onMouseLeave={() => dispatch({ type: 'hover', key: null })}
      onClickCapture={onClick}
    >
      {/*
        Freeze most section interactivity during edit (Links, carousels, etc).
        `[data-inline-editable]` children are explicitly allowed to receive
        pointer events so the canvas inline editor can hover/double-click them.
      */}
      <div className="[&_*]:pointer-events-none [&_*]:select-none [&_[data-inline-editable]]:!pointer-events-auto [&_[data-inline-editable]]:!select-text">
        {children}
      </div>

      {/* Hover / selected outline. Absolute, non-layout-impacting. */}
      <div
        aria-hidden
        className={[
          'pointer-events-none absolute inset-0 transition',
          selected
            ? 'ring-2 ring-inset ring-blue-500 bg-blue-500/0'
            : hovered
              ? 'ring-1 ring-inset ring-blue-400/60'
              : 'ring-0',
        ].join(' ')}
      />

      {/* Floating mini toolbar: appears on hover or while selected. */}
      <div
        data-editor-chrome="true"
        className={[
          'absolute right-3 top-3 z-30 flex items-center gap-1 rounded-full border border-neutral-200 bg-white/95 px-2 py-1 text-[11px] shadow-sm backdrop-blur transition',
          hovered || selected ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-1.5 px-1.5 font-medium text-neutral-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
          {friendly}
        </span>
        {isAdded ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
            NEW
          </span>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${friendly}`}
          title="Delete section"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M4 4h8l-.8 9a1.2 1.2 0 0 1-1.2 1.1H6a1.2 1.2 0 0 1-1.2-1.1L4 4zm2-2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Placeholder rendered in the canvas for sections added locally (no CMS body yet).
 * Keeps document flow intact while signalling that the content will be filled after save.
 */
export function AddedSectionPlaceholder({ sectionType }: { sectionType: string }) {
  const friendly = isAllowedSectionType(sectionType) ? SECTION_LABELS[sectionType] : sectionType;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 py-16 text-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
            New section
          </div>
          <div className="mt-2 text-lg font-medium text-neutral-900">{friendly}</div>
          <div className="mt-1 text-xs text-neutral-500">
            Content will be editable in Sanity Studio after you save.
          </div>
        </div>
      </div>
    </div>
  );
}
