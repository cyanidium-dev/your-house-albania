"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

type Props = {
  currentPage: number;
  totalPages: number;
};

function getPaginationItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: Array<number | "ellipsis"> = [];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  items.push(1);
  if (windowStart > 2) items.push("ellipsis");
  for (let n = windowStart; n <= windowEnd; n++) items.push(n);
  if (windowEnd < total - 1) items.push("ellipsis");
  items.push(total);

  return items;
}

const arrowClass =
  "min-w-10 h-10 rounded-full border border-dark/10 dark:border-white/20 flex items-center justify-center text-dark dark:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40";

/**
 * Page links, not buttons. The buttons pushed `?page=N` from an onClick, so a
 * crawler saw page 1 and nothing else: on the listing pages that left 109 of
 * the 383 properties with no link pointing at them. Each page is now an
 * `<a href>` in the server-rendered HTML; navigation and the scroll to the top
 * are the Link defaults.
 */
export function PropertyPagination({ currentPage, totalPages }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Catalog.pagination");

  // Always render pagination so it's visible even for mocked/static results.
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(currentPage || 1, 1), safeTotalPages);

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const items = getPaginationItems(safeCurrentPage, safeTotalPages);
  const hasPrevious = safeCurrentPage > 1;
  const hasNext = safeCurrentPage < safeTotalPages;

  return (
    <div className="mt-10 flex justify-center">
      <nav className="inline-flex items-center gap-2" aria-label={t("pagination")}>
        {hasPrevious ? (
          <Link
            href={hrefFor(safeCurrentPage - 1)}
            rel="prev"
            className={`${arrowClass} hover:bg-primary/10 hover:border-primary/30`}
            aria-label={t("previousPage")}
          >
            <Icon icon="ph:caret-left" width={20} height={20} />
          </Link>
        ) : (
          <span className={`${arrowClass} opacity-40`} aria-hidden>
            <Icon icon="ph:caret-left" width={20} height={20} />
          </span>
        )}

        {items.map((it, idx) =>
          it === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className="min-w-8 h-8 inline-flex items-center justify-center text-sm text-dark/50 dark:text-white/50"
              aria-hidden
            >
              …
            </span>
          ) : it === safeCurrentPage ? (
            <span
              key={it}
              className="min-w-8 h-8 inline-flex items-center justify-center rounded-full border text-sm px-3 bg-primary text-white border-primary"
              aria-current="page"
            >
              {it}
            </span>
          ) : (
            <Link
              key={it}
              href={hrefFor(it)}
              className="min-w-8 h-8 inline-flex items-center justify-center rounded-full border text-sm px-3 transition-colors duration-200 ease-out border-dark/10 dark:border-white/20 text-dark dark:text-white hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {it}
            </Link>
          )
        )}

        {hasNext ? (
          <Link
            href={hrefFor(safeCurrentPage + 1)}
            rel="next"
            className={`${arrowClass} hover:bg-primary/10 hover:border-primary/30`}
            aria-label={t("nextPage")}
          >
            <Icon icon="ph:caret-right" width={20} height={20} />
          </Link>
        ) : (
          <span className={`${arrowClass} opacity-40`} aria-hidden>
            <Icon icon="ph:caret-right" width={20} height={20} />
          </span>
        )}
      </nav>
    </div>
  );
}
