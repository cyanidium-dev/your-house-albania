"use client";

import * as React from "react";
import Link from "@/components/shared/Link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
import { useUrlSearch } from "@/hooks/useUrlSearch";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { catalogPageIndex } from "@/lib/catalog/listingPagination";

type Props = {
  /** The page the server rendered (`?page=`), 1 on a plain listing URL. */
  currentPage: number;
  /** The next page `onShowMore` will append. */
  nextPage: number;
  /** Pages in the whole listing, for the page index. */
  totalPages: number;
  hasMore: boolean;
  isLoading: boolean;
  onShowMore: () => void;
  /** 1-based position of the first and last card on screen, and the total. */
  from: number;
  to: number;
  total: number;
  /** The query string the server rendered this page for (no leading `?`). */
  serverSearch?: string;
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
 *
 * Under them, an index of every page of the listing (audit M-2), kept in the
 * HTML for crawlers and screen readers but not drawn: a visible page row
 * beside "Show more" made visitors choose between two controls (owner,
 * 2026-10-21).
 * With 24 cards a page Durrës runs past twenty pages, and a next-link chain
 * put its oldest listings twenty clicks from the city page; from any page,
 * every page is now one click away and every listing two. The pages on screen
 * (the one loaded plus any appended) are marked, so the index never claims
 * page 1 while pages 1–4 are showing. `lib/catalog/listingPagination` builds
 * the index, and the click-depth check walks the same function.
 */
export function PropertyPagination({
  currentPage,
  nextPage,
  totalPages,
  hasMore,
  isLoading,
  onShowMore,
  from,
  to,
  total,
  serverSearch = "",
}: Props) {
  const pathname = usePathname();
  // Not `useSearchParams`: see `useUrlSearch`.
  const search = useUrlSearch(serverSearch);
  const t = useTranslations("Catalog.pagination");

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(search);
    params.delete("pageSize");
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const pageIndex = catalogPageIndex(currentPage, totalPages);
  return (
    <nav className="mt-12 flex flex-col items-center gap-3" aria-label={t("pagination")}>
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
          className={brandButtonClass("primary", "min-w-[240px]", "lg")}
        >
          {isLoading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : null}
          {/* In its own element: a translator swaps a bare text node for
              <font>, and the spinner inserted before it then threw
              (insertBefore NotFoundError, Clarity 18.10). */}
          <span>{t("showMore")}</span>
        </Link>
      ) : null}
      <p className="text-sm text-dark/50 dark:text-white/50 tabular-nums">
        {t("shownRange", { from, to, total })}
      </p>
      {currentPage > 1 ? (
        <Link
          href={hrefFor(currentPage - 1)}
          rel="prev"
          className="inline-flex items-center gap-1 text-sm text-dark/50 underline-offset-4 hover:text-primary hover:underline dark:text-white/50"
        >
          <Icon icon="ph:caret-left" width={14} height={14} />
          {t("previousPage")}
        </Link>
      ) : null}
      {/* Every page of the listing, for crawlers and screen readers only
          (audit M-2: each listing two clicks from the place page). On screen
          the visitor has one control, "Show more" (owner, 2026-10-21: a page
          row next to the button made people choose between the two). */}
      {pageIndex.length > 0 ? (
        <ol className="sr-only">
          {pageIndex.map(({ page, current }) => (
            <li key={page}>
              {current ? (
                <span aria-current="page">{page}</span>
              ) : (
                <Link href={hrefFor(page)}>{page}</Link>
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </nav>
  );
}
