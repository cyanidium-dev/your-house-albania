'use client';

import * as React from 'react';
import type {
  EditorAction,
  EditorDispatch,
  EditorSection,
  EditorState,
  FieldChange,
  InsertPosition,
} from './types';
import type { Locale } from '../lib/locales';
import { readLocalizedField, writeLocalizedField } from '../lib/sectionFields';

function indexOfKey(list: EditorSection[], key: string): number {
  for (let i = 0; i < list.length; i++) if (list[i]?._key === key) return i;
  return -1;
}

function moveInArray<T>(arr: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr.slice();
  }
  const out = arr.slice();
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}

function insertAt<T>(arr: readonly T[], item: T, at: InsertPosition): T[] {
  if (at.kind === 'end') return [...arr, item];
  const anchor = indexOfKey(arr as unknown as EditorSection[], at.key);
  if (anchor < 0) return [...arr, item];
  const out = arr.slice();
  const offset = at.kind === 'after' ? anchor + 1 : anchor;
  out.splice(offset, 0, item);
  return out;
}

/**
 * Track in-flight field changes as a map: `${key}|${path}|${locale}` → latest value.
 * Stored in the reducer via a side-channel Map on state. We model it as a plain
 * POJO on state to keep memoization predictable.
 */
type ChangeKey = string;
type ChangeMap = Record<ChangeKey, FieldChange>;

function changeId(c: { key: string; path: readonly string[]; locale: string }): ChangeKey {
  return `${c.key}|${c.path.join('.')}|${c.locale}`;
}

type FullState = EditorState & { _changes: ChangeMap };

function reducer(state: FullState, action: EditorAction): FullState {
  switch (action.type) {
    case 'select':
      return { ...state, selectedKey: action.key };

    case 'hover':
      return { ...state, hoveredKey: action.key };

    case 'setActiveLocale':
      if (action.locale === state.locale) return state;
      return { ...state, locale: action.locale };

    case 'reorderByKey': {
      const from = indexOfKey(state.draft, action.fromKey);
      const to = indexOfKey(state.draft, action.toKey);
      if (from < 0 || to < 0 || from === to) return state;
      return { ...state, draft: moveInArray(state.draft, from, to) };
    }

    case 'reorderByIndex': {
      if (action.from === action.to) return state;
      return { ...state, draft: moveInArray(state.draft, action.from, action.to) };
    }

    case 'add': {
      const added = new Set(state.addedKeys);
      added.add(action.section._key);
      return {
        ...state,
        draft: insertAt(state.draft, action.section, action.at),
        addedKeys: added,
        selectedKey: action.section._key,
      };
    }

    case 'delete': {
      const key = action.key;
      const existedInOriginal = indexOfKey(state.original, key) >= 0;
      const nextDraft = state.draft.filter((s) => s._key !== key);

      const addedKeys = new Set(state.addedKeys);
      const deletedKeys = new Set(state.deletedKeys);
      const changedKeys = new Set(state.changedKeys);

      // Drop any pending content edits for this key.
      const nextChanges: ChangeMap = {};
      for (const [k, v] of Object.entries(state._changes)) {
        if (v.key !== key) nextChanges[k] = v;
      }
      changedKeys.delete(key);

      if (addedKeys.has(key)) {
        addedKeys.delete(key);
      } else if (existedInOriginal) {
        deletedKeys.add(key);
      }

      return {
        ...state,
        draft: nextDraft,
        addedKeys,
        deletedKeys,
        changedKeys,
        _changes: nextChanges,
        selectedKey: state.selectedKey === key ? null : state.selectedKey,
        hoveredKey: state.hoveredKey === key ? null : state.hoveredKey,
      };
    }

    case 'setLocalizedField': {
      const { key, path, locale, value } = action;
      const idx = indexOfKey(state.draft, key);
      if (idx < 0) return state;

      const section = state.draft[idx];
      const nextSection = writeLocalizedField(section as Record<string, unknown>, path, locale, value);
      const nextDraft = state.draft.slice();
      nextDraft[idx] = nextSection as EditorSection;

      // Record change vs. original (for originals) or absolute (for added keys).
      const nextChanges: ChangeMap = { ...state._changes };
      const changedKeys = new Set(state.changedKeys);
      const isAdded = state.addedKeys.has(key);
      const originalIdx = indexOfKey(state.original, key);
      const originalSection = originalIdx >= 0 ? state.original[originalIdx] : undefined;
      const originalValue = originalSection
        ? readLocalizedField(originalSection, path, locale)
        : '';

      const cid = changeId({ key, path, locale });
      if (!isAdded && value === originalValue) {
        // Reverted back to the original value — drop the change.
        delete nextChanges[cid];
      } else {
        nextChanges[cid] = { key, path, locale, value };
      }

      if (!isAdded) {
        // changedKeys tracks only originals with divergent content.
        const anyRemainingForKey = Object.values(nextChanges).some(
          (c) => c.key === key && !state.addedKeys.has(c.key),
        );
        if (anyRemainingForKey) changedKeys.add(key);
        else changedKeys.delete(key);
      }

      return { ...state, draft: nextDraft, _changes: nextChanges, changedKeys };
    }

    case 'cancel':
      return {
        ...state,
        draft: state.original.slice(),
        addedKeys: new Set(),
        deletedKeys: new Set(),
        changedKeys: new Set(),
        _changes: {},
        selectedKey: null,
        hoveredKey: null,
      };

    case 'commit':
      return {
        ...state,
        original: action.nextOriginal.slice(),
        draft: action.nextOriginal.slice(),
        addedKeys: new Set(),
        deletedKeys: new Set(),
        changedKeys: new Set(),
        _changes: {},
      };

    default:
      return state;
  }
}

type EditorContextValue = {
  state: EditorState;
  dispatch: EditorDispatch;
  dirty: boolean;
  orderedKeys: string[];
  /** Added sections (full bodies) pending save. */
  pendingAdded: EditorSection[];
  /** Deleted original keys pending save. */
  pendingDeleted: string[];
  /**
   * Content edits pending save. For added sections we still emit entries so
   * the server can apply them after the section is created (one patch pass).
   */
  pendingChanged: FieldChange[];
};

const EditorContext = React.createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = React.useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>');
  return ctx;
}

export function EditorProvider({
  landingId,
  landingTitle,
  landingSlug,
  pageType,
  locale,
  availableLocales,
  initialSections,
  children,
}: {
  landingId: string;
  landingTitle: string;
  landingSlug?: string;
  pageType?: string;
  locale: Locale;
  availableLocales: readonly Locale[];
  initialSections: EditorSection[];
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(reducer, undefined, () => {
    const original = initialSections.slice();
    const initial: FullState = {
      landingId,
      landingTitle,
      landingSlug,
      pageType,
      locale,
      availableLocales,
      original,
      draft: original.slice(),
      addedKeys: new Set<string>(),
      deletedKeys: new Set<string>(),
      changedKeys: new Set<string>(),
      selectedKey: null,
      hoveredKey: null,
      _changes: {},
    };
    return initial;
  });

  const value = React.useMemo<EditorContextValue>(() => {
    const dirty =
      state.addedKeys.size > 0 ||
      state.deletedKeys.size > 0 ||
      state.changedKeys.size > 0 ||
      !sameOrder(state.draft, state.original);
    const orderedKeys = state.draft.map((s) => s._key);
    const pendingAdded = state.draft.filter((s) => state.addedKeys.has(s._key));
    const pendingDeleted = Array.from(state.deletedKeys);
    const pendingChanged = Object.values(state._changes);
    // Strip internal `_changes` from the exposed state.
    const { _changes: _drop, ...publicState } = state;
    void _drop;
    return {
      state: publicState,
      dispatch,
      dirty,
      orderedKeys,
      pendingAdded,
      pendingDeleted,
      pendingChanged,
    };
  }, [state]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

function sameOrder(a: EditorSection[], b: EditorSection[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i]._key !== b[i]._key) return false;
  return true;
}
