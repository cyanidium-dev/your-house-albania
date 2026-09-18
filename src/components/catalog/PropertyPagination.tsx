"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

type Props = {
  /** The page the server rendered (`?page=`), 1 on a plain listing URL. */
  currentPage: number;
  /** The next page `onShowMore` will append. */
  nextPage: number;
  hasMore: boolean;
  isLoading: boolean;
  onShowMore: () => void;
  /** 1-based position of the first and last card on screen, and the total. */
  from: number;
  to: number;
  total: number;
};

/**
 * "Show more": one control for people and for crawlers.
 *
 * The listing used to run two at once — an infinite scroll that appended pages
 * as the visitor neared the bottom, and numbered page links under it that no
 * longer matched what was on screen (page 1 highlighted while pages 1–4 were
 * showing), with the footer and its contacts forever pushed out of reach.
 *
 * Now the next page is a real `<a href="?page=N">` in the server HTML, so a
 * crawler walks page to page and reaches every listing (the reason the page
 * links existed: 109 of 383 properties had no other link). A click is
 * intercepted and appends the cards in place instead, so the visitor keeps
 * their scroll position and decides when to load more. A visitor who lands on
 * `?page=3` from search also gets a link back to the page before.
 */
export function PropertyPagination({
  currentPage,
  nextPage,
  hasMore,
  isLoading,
  onShowMore,
  from,
  to,
  total,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Catalog.pagination");

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pageSize");
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <nav className="mt-10 flex flex-col items-center gap-3" aria-label={t("pagination")}>
      <p className="text-sm text-dark/60 dark:text-white/60 tabular-nums">
        {t("shownRange", { from, to, total })}
      </p>
      {hasMore ? (
        <Link
          href={hrefFor(nextPage)}
          rel="next"
          scroll={false}
          onClick={(e) => {
            // Crawlers follow the href; people get the cards appended here.
            // A modified click still opens the page in a new tab.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            if (!isLoading) onShowMore();
          }}
          aria-busy={isLoading || undefined}
          className="inline-flex h-12 min-w-[240px] items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {isLoading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : null}
          {t("showMore")}
        </Link>
      ) : null}
      {currentPage > 1 ? (
        <Link
          href={hrefFor(currentPage - 1)}
          rel="prev"
          className="inline-flex items-center gap-1 text-sm text-dark/60 underline-offset-4 hover:text-primary hover:underline dark:text-white/60"
        >
          <Icon icon="ph:caret-left" width={16} height={16} />
          {t("previousPage")}
        </Link>
      ) : null}
    </nav>
  );
}
