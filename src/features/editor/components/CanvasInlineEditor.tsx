'use client';

import * as React from 'react';
import { useEditor } from '../state/EditorContext';
import { getFieldsForType, readLocalizedField } from '../lib/sectionFields';
import type { EditorSection } from '../state/types';

/**
 * Canvas-side inline editor.
 *
 * Server-rendered section HTML is opaque to us, so on every relevant state
 * change we scan each section's subtree for a DOM element whose plain text
 * matches one of the configured editable localized values. That element is
 * decorated in-place with hover outline + double-click to edit behavior.
 *
 *  • Double-click activates `contenteditable='plaintext-only'`.
 *  • `input` events dispatch `setLocalizedField` so inspector + draft stay
 *    synchronized with canvas typing.
 *  • Enter commits + blurs. Escape reverts to the current draft value.
 *
 * We keep a persistent element reference per (sectionKey, fieldPath) so that
 * once we've located a target, later draft reversals (cancel) can update
 * that same element even if its text no longer matches any known value.
 */
export function CanvasInlineEditor() {
  const { state, dispatch } = useEditor();

  // Element currently in content-edit mode — skip DOM sync writes into it so
  // the caret never jumps while the user types.
  const activeElRef = React.useRef<HTMLElement | null>(null);

  // Stable targets per `${key}|${path}` so we keep syncing the element we've
  // already bound, even after cancel/revert when its textContent no longer
  // matches the current or original values.
  const targetsRef = React.useRef<Map<string, HTMLElement>>(new Map());

  // Cleanup handlers installed on targets by this effect run so next run can
  // detach them cleanly.
  const cleanupsRef = React.useRef<Array<() => void>>([]);

  React.useEffect(() => {
    // Tear down previous handlers. Element decorations (attributes, cursor)
    // are idempotent and safe to leave in place.
    for (const c of cleanupsRef.current) c();
    cleanupsRef.current = [];

    for (const section of state.draft) {
      const fields = getFieldsForType(section._type);
      if (fields.length === 0) continue;

      const host = document.querySelector<HTMLElement>(
        `[data-section-key="${cssAttrEscape(section._key)}"]`,
      );
      if (!host) continue;

      for (const field of fields) {
        const draftValue = readLocalizedField(section, field.path, state.locale);
        const originalSection = state.original.find((s) => s._key === section._key);
        const originalValue = originalSection
          ? readLocalizedField(originalSection, field.path, state.locale)
          : '';
        const trimmedDraft = draftValue.trim();
        const trimmedOriginal = originalValue.trim();
        const mapKey = `${section._key}|${field.path.join('.')}`;

        // Prefer the previously-bound target; otherwise try to find one now.
        let target = targetsRef.current.get(mapKey);
        if (target && !host.contains(target)) {
          // The server-rendered DOM for this section has been replaced
          // (e.g. locale switch). Drop the stale reference.
          targetsRef.current.delete(mapKey);
          target = undefined;
        }
        if (!target) {
          target = findEditableTarget(host, trimmedDraft, trimmedOriginal) ?? undefined;
          if (target) targetsRef.current.set(mapKey, target);
        }
        if (!target) continue;

        target.dataset.editableField = field.path.join('.');
        target.dataset.editableKey = section._key;

        // Sync DOM with draft unless the user is actively typing in it.
        if (activeElRef.current !== target) {
          const currentText = (target.textContent ?? '').trim();
          if (currentText !== trimmedDraft) {
            target.textContent = draftValue;
          }
        }

        const cleanup = attachInlineHandlers(target, {
          onBeginEdit: () => {
            activeElRef.current = target!;
          },
          onEndEdit: () => {
            if (activeElRef.current === target) activeElRef.current = null;
          },
          onInputValue: (next) => {
            dispatch({
              type: 'setLocalizedField',
              key: section._key,
              path: field.path,
              locale: state.locale,
              value: next,
            });
          },
          getDraftValue: () => readLocalizedField(section, field.path, state.locale),
        });
        cleanupsRef.current.push(cleanup);
      }
    }

    return () => {
      for (const c of cleanupsRef.current) c();
      cleanupsRef.current = [];
    };
    // Re-scan whenever draft, locale, or the committed baseline changes.
  }, [state.draft, state.locale, state.original, dispatch]);

  return null;
}

function findEditableTarget(
  host: HTMLElement,
  trimmedDraft: string,
  trimmedOriginal: string,
): HTMLElement | null {
  const candidates = [trimmedDraft, trimmedOriginal].filter((v): v is string => Boolean(v));
  for (const target of candidates) {
    const match = findDeepestTextMatch(host, target);
    if (match) return match;
  }
  return null;
}

/** Depth-first search for the deepest element whose trimmed textContent matches. */
function findDeepestTextMatch(root: HTMLElement, text: string): HTMLElement | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let best: HTMLElement | null = null;
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node instanceof HTMLElement) {
      if (
        node.hasAttribute('data-editor-chrome') ||
        node.closest('[data-editor-chrome]')
      ) {
        node = walker.nextNode();
        continue;
      }
      const tc = node.textContent?.trim() ?? '';
      if (tc === text) best = node;
    }
    node = walker.nextNode();
  }
  return best;
}

type InlineHandlerOpts = {
  onBeginEdit: () => void;
  onEndEdit: () => void;
  onInputValue: (next: string) => void;
  getDraftValue: () => string;
};

function attachInlineHandlers(el: HTMLElement, opts: InlineHandlerOpts): () => void {
  el.setAttribute('data-inline-editable', 'true');
  el.style.cursor = 'text';

  const onDblClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    beginEdit();
  };
  const onInput = () => {
    if (!el.isContentEditable) return;
    opts.onInputValue(el.innerText);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!el.isContentEditable) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };
  const onBlur = () => commitEdit();

  function beginEdit() {
    if (el.isContentEditable) return;
    el.setAttribute('contenteditable', 'plaintext-only');
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    opts.onBeginEdit();
  }

  function commitEdit() {
    if (!el.isContentEditable) return;
    el.removeAttribute('contenteditable');
    opts.onEndEdit();
    opts.onInputValue(el.innerText);
  }

  function cancelEdit() {
    if (!el.isContentEditable) return;
    el.removeAttribute('contenteditable');
    el.textContent = opts.getDraftValue();
    opts.onEndEdit();
  }

  el.addEventListener('dblclick', onDblClick);
  el.addEventListener('input', onInput);
  el.addEventListener('keydown', onKeyDown);
  el.addEventListener('blur', onBlur);

  return () => {
    el.removeEventListener('dblclick', onDblClick);
    el.removeEventListener('input', onInput);
    el.removeEventListener('keydown', onKeyDown);
    el.removeEventListener('blur', onBlur);
  };
}

function cssAttrEscape(v: string): string {
  return v.replace(/"/g, '\\"');
}
