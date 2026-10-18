"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
import { cn } from "@/lib/utils";

const SORTS = ["newest", "popular", "priceAsc", "priceDesc", "pricePerSqmAsc", "areaDesc"] as const;
type Sort = (typeof SORTS)[number];

const LABEL_KEY: Record<Sort, string> = {
  newest: "sortNewest",
  popular: "sortPopular",
  priceAsc: "sortPriceAsc",
  priceDesc: "sortPriceDesc",
  pricePerSqmAsc: "sortPricePerSqmAsc",
  areaDesc: "sortAreaDesc",
};

/**
 * Sort over the results, where people look for it. It used to live only inside
 * the filter form (behind "More filters" on phones). Changing it keeps every
 * other filter and goes back to page 1.
 *
 * The site's own listbox (the same trigger-and-popover the filter selects
 * use), not a native `<select>`: the OS drew its popup — a white list with a
 * blue highlight over the dark theme — and no CSS reaches that (18.10).
 */
export function CatalogSortSelect({ initialSort }: { initialSort?: string }) {
  const t = useTranslations("Catalog.filters");
  const router = useRouter();
  const value: Sort = (SORTS as readonly string[]).includes(initialSort ?? "") ? (initialSort as Sort) : "newest";
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (e.target instanceof Node && !containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const pick = (next: Sort) => {
    setOpen(false);
    if (next === value) return;
    const url = new URL(window.location.href);
    if (next === "newest") url.searchParams.delete("sort");
    else url.searchParams.set("sort", next);
    url.searchParams.delete("page");
    router.push(`${url.pathname}${url.search}`, { scroll: false });
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        data-catalog-sort
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("sortBy")}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-full border border-dark/15 pl-3 pr-3 text-base font-medium text-dark transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-white/20 dark:text-white md:h-9 md:text-sm"
      >
        <Icon icon="ph:sort-ascending" width={16} height={16} className="shrink-0 text-dark/55 dark:text-white/60" aria-hidden />
        <span className="min-w-0 truncate">{t(LABEL_KEY[value])}</span>
        <Icon
          icon="ph:caret-down"
          width={14}
          height={14}
          className={cn("shrink-0 text-dark/50 transition-transform dark:text-white/50", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={t("sortBy")}
          className="absolute left-0 top-full z-[110] mt-2 min-w-[14rem] rounded-2xl border border-dark/10 bg-white py-1 text-sm shadow-3xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 dark:border-white/10 dark:bg-dark"
        >
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={s === value}
              onClick={() => pick(s)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-dark outline-none hover:bg-primary/15 hover:text-primary dark:text-white dark:hover:bg-primary/25",
                s === value && "font-semibold text-primary",
              )}
            >
              <span>{t(LABEL_KEY[s])}</span>
              {s === value ? <Icon icon="ph:check" width={16} height={16} className="shrink-0" aria-hidden /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
