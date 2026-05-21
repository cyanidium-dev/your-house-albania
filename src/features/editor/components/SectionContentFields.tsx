'use client';

import * as React from 'react';
import { useEditor } from '../state/EditorContext';
import { getFieldsForType, readLocalizedField, type FieldDef } from '../lib/sectionFields';
import type { EditorSection } from '../state/types';

/**
 * Renders the per-section editable text fields in the inspector.
 *
 * - Reads and writes `section[...path][locale]` via the reducer.
 * - Debounces nothing: React is fast enough for a handful of sections; edits
 *   flow into draft immediately so the canvas preview stays in sync.
 * - For section types with no configured fields, returns an empty-state card.
 */
export function SectionContentFields({ section }: { section: EditorSection }) {
  const { state, dispatch } = useEditor();
  const fields = getFieldsForType(section._type);

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-center text-xs text-neutral-500">
        No inline fields available yet for this section. Edit full content in Sanity Studio.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f) => (
        <FieldRow
          key={fieldId(f)}
          field={f}
          section={section}
          locale={state.locale}
          onChange={(value) =>
            dispatch({
              type: 'setLocalizedField',
              key: section._key,
              path: f.path,
              locale: state.locale,
              value,
            })
          }
        />
      ))}
    </div>
  );
}

function fieldId(f: FieldDef): string {
  return f.path.join('.');
}

function FieldRow({
  field,
  section,
  locale,
  onChange,
}: {
  field: FieldDef;
  section: EditorSection;
  locale: string;
  onChange: (value: string) => void;
}) {
  const value = readLocalizedField(section, field.path, locale);
  const inputId = `f-${section._key}-${fieldId(field)}`;

  const baseInput =
    'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-900/10';

  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        <span>{field.label}</span>
        <span className="font-mono text-[10px] font-normal text-neutral-400">
          {field.path.join('.')}
        </span>
      </span>
      {field.kind === 'textarea' ? (
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60) || 2))}
          className={`${baseInput} resize-y leading-snug`}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInput}
        />
      )}
      {field.hint ? <span className="text-[11px] text-neutral-500">{field.hint}</span> : null}
    </label>
  );
}
