'use client';

import * as React from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor } from '../state/EditorContext';
import { SECTION_LABELS, isAllowedSectionType } from '../lib/sectionDefaults';

const PANEL_WIDTH_PX = 296;

export function SectionsPanel({
  collapsed,
  onCollapse,
  onOpenAdd,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onOpenAdd: () => void;
}) {
  const { state, dispatch, orderedKeys, pendingDeleted } = useEditor();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      dispatch({
        type: 'reorderByKey',
        fromKey: String(active.id),
        toKey: String(over.id),
      });
    },
    [dispatch],
  );

  if (collapsed) {
    return (
      <aside
        className="fixed left-0 top-12 z-40 flex h-[calc(100vh-3rem)] w-10 flex-col items-center border-r border-neutral-200 bg-white/95 py-3 backdrop-blur"
        aria-label="Sections panel (collapsed)"
      >
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition hover:bg-neutral-100"
          aria-label="Expand sections panel"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="fixed left-0 top-12 z-40 flex h-[calc(100vh-3rem)] flex-col border-r border-neutral-200 bg-white/95 backdrop-blur"
      style={{ width: PANEL_WIDTH_PX }}
      aria-label="Sections panel"
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
            Sections
          </div>
          <div className="text-xs text-neutral-500">
            {orderedKeys.length} · {pendingDeleted.length} pending delete
          </div>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100"
          aria-label="Collapse sections panel"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M10 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={orderedKeys} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-1">
              {state.draft.map((s, i) => (
                <SortableItem
                  key={s._key}
                  sectionKey={s._key}
                  sectionType={s._type}
                  index={i}
                  added={state.addedKeys.has(s._key)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </div>

      <div className="border-t border-neutral-200 p-3">
        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-3 text-xs font-semibold text-white transition hover:bg-neutral-700"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Add section
        </button>
      </div>
    </aside>
  );
}

export { PANEL_WIDTH_PX as SECTIONS_PANEL_WIDTH };

function SortableItem({
  sectionKey,
  sectionType,
  index,
  added,
}: {
  sectionKey: string;
  sectionType: string;
  index: number;
  added: boolean;
}) {
  const { state, dispatch } = useEditor();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionKey,
  });

  const selected = state.selectedKey === sectionKey;
  const label = isAllowedSectionType(sectionType) ? SECTION_LABELS[sectionType] : sectionType;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function onSelect(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch({ type: 'select', key: sectionKey });
    // Scroll the real section into view when user picks from the list.
    const target = document.querySelector<HTMLElement>(`[data-section-key="${sectionKey}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete this ${label} section? Save to persist.`)) return;
    dispatch({ type: 'delete', key: sectionKey });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition',
        selected
          ? 'border-blue-400 bg-blue-50'
          : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50',
        isDragging ? 'opacity-60 shadow-lg' : '',
      ].join(' ')}
    >
      <button
        type="button"
        className="inline-flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-neutral-400 transition hover:bg-white hover:text-neutral-700 active:cursor-grabbing"
        aria-label={`Drag ${label}`}
        {...attributes}
        {...listeners}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
          <g fill="currentColor">
            <circle cx="6" cy="4" r="1.3" />
            <circle cx="6" cy="8" r="1.3" />
            <circle cx="6" cy="12" r="1.3" />
            <circle cx="10" cy="4" r="1.3" />
            <circle cx="10" cy="8" r="1.3" />
            <circle cx="10" cy="12" r="1.3" />
          </g>
        </svg>
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-100 px-1 text-[10px] font-semibold text-neutral-600">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-800">
          {label}
        </span>
        {added ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-[9px] font-semibold text-amber-800">
            NEW
          </span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 transition opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
        aria-label={`Delete ${label}`}
        title="Delete section"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M4 4h8l-.8 9a1.2 1.2 0 0 1-1.2 1.1H6a1.2 1.2 0 0 1-1.2-1.1L4 4zm2-2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  );
}
