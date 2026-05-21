'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEditor } from '../state/EditorContext';

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'error'; message: string }
  | { kind: 'saved' };

/**
 * Fixed top strip. Only layout chrome that the center canvas ever sits under —
 * side panels are independent. Keep this visually quiet so real-page content
 * below dominates the frame.
 */
export function EditorTopBar({
  saveState,
  onSave,
  onCancel,
  leftToggle,
  rightToggle,
}: {
  saveState: SaveState;
  onSave: () => void;
  onCancel: () => void;
  leftToggle?: React.ReactNode;
  rightToggle?: React.ReactNode;
}) {
  const { state, dirty } = useEditor();
  const router = useRouter();

  async function logout() {
    await fetch('/api/editor/logout', { method: 'POST' });
    router.replace('/editor/login');
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center gap-2 border-b border-neutral-200 bg-white/95 px-3 backdrop-blur">
      {leftToggle}
      <Link
        href="/editor"
        className="ml-1 inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-neutral-900 text-[10px] font-bold text-white">
          D
        </span>
        Editor
      </Link>
      <span className="text-neutral-300">/</span>
      <span className="min-w-0 truncate text-sm text-neutral-700">{state.landingTitle}</span>
      {state.pageType && (
        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
          {state.pageType}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <SaveStatus saveState={saveState} dirty={dirty} />
        <button
          type="button"
          onClick={onCancel}
          disabled={!dirty || saveState.kind === 'saving'}
          className="inline-flex h-8 items-center rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saveState.kind === 'saving'}
          className="inline-flex h-8 items-center rounded-full bg-neutral-900 px-4 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveState.kind === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={logout}
          className="ml-1 inline-flex h-8 items-center rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Sign out
        </button>
        {rightToggle}
      </div>
    </header>
  );
}

function SaveStatus({ saveState, dirty }: { saveState: SaveState; dirty: boolean }) {
  if (saveState.kind === 'saving') {
    return <span className="text-xs text-neutral-600">Saving…</span>;
  }
  if (saveState.kind === 'error') {
    return (
      <span className="max-w-[240px] truncate text-xs text-red-600" title={saveState.message}>
        {saveState.message}
      </span>
    );
  }
  if (saveState.kind === 'saved' && !dirty) {
    return <span className="text-xs text-emerald-600">Saved</span>;
  }
  if (dirty) return <span className="text-xs text-neutral-600">Unsaved changes</span>;
  return null;
}
