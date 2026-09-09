import type { ReactNode } from 'react';
import '../globals.css';

/**
 * Editor root layout.
 *
 * This is one of the app's two root layouts and therefore declares its own
 * <html>/<body>. The split exists so the public tree's root layout can live at
 * `[locale]/layout.tsx` and read the locale from its own params: the previous
 * single root layout sat above `[locale]`, could only get the locale from
 * `headers()`, and that one call made every route on the site dynamic and
 * uncacheable.
 *
 * The editor still avoids all public client code because:
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
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
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
      </body>
    </html>
  );
}
