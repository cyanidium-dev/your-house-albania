import type { ReactNode } from 'react';

/**
 * Editor shell wrapper.
 *
 * Must NOT declare its own <html>/<body> — Next.js has a single root layout
 * at `src/app/layout.tsx`. This wrapper only scopes editor-specific styling
 * and metadata. The editor still avoids all public client code because:
 *   - `/editor/**` is outside `[locale]` (no `LocaleLayout`, no Header/Footer)
 *   - `/editor` is excluded from `next-intl` middleware
 *   - @dnd-kit and editor UI are imported only inside this tree, so Next.js
 *     route-level code-splitting keeps them out of public bundles.
 */
export const metadata = {
  title: 'Domlivo Editor',
  robots: { index: false, follow: false },
};

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/*
        Editor-only visual cues for inline-editable text nodes. The selectors
        exist only inside /editor/**, so the public site is untouched.
      */}
      <style>{`
        [data-inline-editable] {
          outline: 0;
          transition: box-shadow 120ms;
        }
        [data-inline-editable]:hover {
          box-shadow: inset 0 0 0 2px rgba(59,130,246,0.35);
          border-radius: 4px;
        }
        [data-inline-editable][contenteditable="plaintext-only"],
        [data-inline-editable][contenteditable="true"] {
          box-shadow: inset 0 0 0 2px rgba(59,130,246,0.9);
          background: rgba(219,234,254,0.45);
          border-radius: 4px;
        }
      `}</style>
      {children}
    </div>
  );
}
