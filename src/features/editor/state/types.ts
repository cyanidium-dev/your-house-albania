import type { ReactNode } from 'react';
import type { Locale } from '../lib/locales';

/** Minimal structural section shape used by the editor state. */
export type EditorSection = {
  _key: string;
  _type: string;
  /** Other fields are preserved verbatim — the editor never mutates them. */
  [field: string]: unknown;
};

/** Server-rendered node for a section already present in the CMS. */
export type ServerSectionNode = { key: string; type: string; node: ReactNode };

export type InsertPosition =
  | { kind: 'end' }
  | { kind: 'after'; key: string }
  | { kind: 'before'; key: string };

export type EditorState = {
  landingId: string;
  landingTitle: string;
  landingSlug?: string;
  pageType?: string;
  locale: Locale;
  availableLocales: readonly Locale[];
  /** Snapshot of sections as loaded from server. Used for cancel + diff. */
  original: EditorSection[];
  /** Current working copy. Reorder/add/delete/edit act on this. */
  draft: EditorSection[];
  /** Keys added locally and not yet saved. */
  addedKeys: ReadonlySet<string>;
  /** Keys that existed originally but the user removed locally. */
  deletedKeys: ReadonlySet<string>;
  /** Keys (original) whose content has been edited locally. */
  changedKeys: ReadonlySet<string>;
  selectedKey: string | null;
  hoveredKey: string | null;
};

export type EditorAction =
  | { type: 'select'; key: string | null }
  | { type: 'hover'; key: string | null }
  | { type: 'setActiveLocale'; locale: Locale }
  | { type: 'reorderByKey'; fromKey: string; toKey: string }
  | { type: 'reorderByIndex'; from: number; to: number }
  | { type: 'add'; section: EditorSection; at: InsertPosition }
  | { type: 'delete'; key: string }
  | {
      type: 'setLocalizedField';
      key: string;
      path: readonly string[];
      locale: string;
      value: string;
    }
  | { type: 'cancel' }
  | { type: 'commit'; nextOriginal: EditorSection[] };

export type EditorDispatch = (action: EditorAction) => void;

/** Localized-text change targeting `pageSections[_key == $key].<path>.<locale>`. */
export type FieldChange = {
  key: string;
  path: readonly string[];
  locale: string;
  value: string;
};

/** Payload sent to the save endpoint. */
export type SavePayload = {
  landingId: string;
  /** Final order of all keys (including added) after save. */
  order: string[];
  /** Newly added section bodies (full, including _key + _type). */
  added: EditorSection[];
  /** Keys of originals to remove. */
  deleted: string[];
  /** Content edits for originals and added sections. */
  changed: FieldChange[];
  /** Optional paths to revalidate. */
  revalidate?: string[];
};

export type SaveResponse =
  | { ok: true; order: string[] }
  | { ok: false; reason: string };
