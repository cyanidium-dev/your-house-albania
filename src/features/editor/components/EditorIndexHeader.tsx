'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Header used on editor pages that are NOT inside the landing editor shell
 * (eg. the landings index). The landing editor itself has its own
 * `EditorTopBar` with save/cancel baked in.
 */
export function EditorIndexHeader({ title }: { title?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/editor/logout', { method: 'POST' });
    router.replace('/editor/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur">
      <Link
        href="/editor"
        className="inline-flex items-center gap-2 font-semibold tracking-tight text-neutral-900"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 text-[11px] font-bold text-white">
          D
        </span>
        Editor
      </Link>
      {title ? (
        <>
          <span className="text-neutral-300">/</span>
          <span className="truncate text-sm font-medium text-neutral-700">{title}</span>
        </>
      ) : null}
      <div className="ml-auto">
        <button
          type="button"
          onClick={logout}
          className="inline-flex h-8 items-center rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
