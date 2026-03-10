"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

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

export function PropertyPagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Always render pagination so it's visible even for mocked/static results.
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(currentPage || 1, 1), safeTotalPages);

  const setPage = (page: number) => {
    const next = Math.min(Math.max(page, 1), safeTotalPages);
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(next));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const items = getPaginationItems(safeCurrentPage, safeTotalPages);

  return (
    <div className="mt-10 flex justify-center">
      <nav className="inline-flex items-center gap-2" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safeCurrentPage === 1}
          className="rounded-full"
          onClick={() => setPage(safeCurrentPage - 1)}
        >
          Prev
        </Button>

        {items.map((it, idx) =>
          it === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className="min-w-8 h-8 inline-flex items-center justify-center text-sm text-dark/50 dark:text-white/50"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={it}
              type="button"
              onClick={() => setPage(it)}
              className={[
                "min-w-8 h-8 rounded-full border text-sm px-3 transition-colors duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-primary/40",
                it === safeCurrentPage
                  ? "bg-primary text-white border-primary"
                  : "border-dark/10 dark:border-white/20 text-dark dark:text-white hover:bg-primary/10 hover:text-primary",
              ].join(" ")}
              aria-current={it === safeCurrentPage ? "page" : undefined}
            >
              {it}
            </button>
          )
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safeCurrentPage === safeTotalPages}
          className="rounded-full"
          onClick={() => setPage(safeCurrentPage + 1)}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}
