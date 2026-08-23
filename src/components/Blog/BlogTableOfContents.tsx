"use client";

import { useTranslations } from "next-intl";
import { collectHeadings } from "@/lib/blog/headingAnchors";

type Props = {
  /** Resolved Portable Text for the current locale. */
  content: unknown[];
};

/**
 * Contents built from the article's own h2/h3, anchored with the same ids the
 * renderer stamps — see `headingAnchors`.
 *
 * An article with fewer than two headings renders nothing: a one-item contents
 * list tells a reader less than the heading itself already does.
 */
export function BlogTableOfContents({ content }: Props) {
  const t = useTranslations("Blog");
  const headings = collectHeadings(Array.isArray(content) ? content : []);
  if (headings.length < 2) return null;

  const list = (
    <ol className="flex flex-col gap-2">
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? "ps-4" : undefined}>
          <a
            href={`#${h.id}`}
            className="text-dark/75 dark:text-white/75 hover:text-primary text-sm leading-snug transition-colors"
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      {/* Mobile: collapsed above the article so it costs no vertical space. */}
      <details className="lg:hidden border border-dark/10 dark:border-white/20 rounded-lg p-4 mb-6">
        <summary className="text-dark dark:text-white font-medium cursor-pointer">
          {t("tableOfContents")}
        </summary>
        <nav aria-label={t("tableOfContents")} className="mt-3">
          {list}
        </nav>
      </details>

      <nav
        aria-label={t("tableOfContents")}
        className="hidden lg:block lg:sticky lg:top-24 border border-dark/10 dark:border-white/20 rounded-lg p-5"
      >
        <p className="text-dark dark:text-white font-medium mb-3">
          {t("tableOfContents")}
        </p>
        {list}
      </nav>
    </>
  );
}
