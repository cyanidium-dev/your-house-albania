"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";

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
 */
export function CatalogSortSelect({ initialSort }: { initialSort?: string }) {
  const t = useTranslations("Catalog.filters");
  const router = useRouter();
  const value: Sort = (SORTS as readonly string[]).includes(initialSort ?? "") ? (initialSort as Sort) : "newest";

  return (
    <label className="relative inline-flex h-9 min-w-0 items-center gap-2 rounded-full border border-dark/15 pl-3 pr-8 text-sm text-dark hover:border-primary dark:border-white/20 dark:text-white">
      <Icon icon="ph:sort-ascending" width={16} height={16} className="shrink-0 text-dark/55 dark:text-white/60" aria-hidden />
      <span className="sr-only">{t("sortBy")}</span>
      <select
        data-catalog-sort
        value={value}
        onChange={(e) => {
          const url = new URL(window.location.href);
          if (e.target.value === "newest") url.searchParams.delete("sort");
          else url.searchParams.set("sort", e.target.value);
          url.searchParams.delete("page");
          router.push(`${url.pathname}${url.search}`, { scroll: false });
        }}
        className="min-w-0 cursor-pointer appearance-none truncate bg-transparent font-medium outline-none"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(LABEL_KEY[s])}
          </option>
        ))}
      </select>
      <Icon icon="ph:caret-down" width={14} height={14} className="pointer-events-none absolute right-3 text-dark/50 dark:text-white/50" aria-hidden />
    </label>
  );
}
