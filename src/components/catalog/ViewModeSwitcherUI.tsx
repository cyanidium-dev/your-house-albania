"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { ViewMode } from "@/lib/catalog/viewMode";
import { useCatalogViewOptional } from "@/contexts/CatalogViewContext";
import { cn } from "@/lib/utils";

export function ViewModeSwitcherUI({
  fallbackViewMode,
  fallbackSetViewMode,
}: {
  fallbackViewMode: ViewMode;
  fallbackSetViewMode: (view: ViewMode) => void;
}) {
  const ctx = useCatalogViewOptional();
  const viewMode = ctx?.viewMode ?? fallbackViewMode;
  const setViewMode = ctx?.setViewMode ?? fallbackSetViewMode;
  const t = useTranslations("Catalog.filters");
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-dark/70 dark:text-white/80">
        {t("viewLabel")}
      </p>
      <div className="flex items-center justify-start">
        <div className="inline-flex gap-0.5 rounded-full p-0.5 bg-dark/5 dark:bg-white/10">
        <button
          type="button"
          onClick={() => setViewMode("large")}
          title={t("viewLarge")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-dark/70 dark:text-white/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            viewMode === "large"
              ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm"
              : "hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
          )}
          aria-pressed={viewMode === "large"}
        >
          <Icon icon="ph:square" width={18} height={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("small")}
          title={t("viewSmall")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-dark/70 dark:text-white/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            viewMode === "small"
              ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm"
              : "hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
          )}
          aria-pressed={viewMode === "small"}
        >
          <Icon icon="ph:squares-four" width={18} height={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          title={t("viewList")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-dark/70 dark:text-white/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            viewMode === "list"
              ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm"
              : "hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
          )}
          aria-pressed={viewMode === "list"}
        >
          <Icon icon="ph:list" width={18} height={18} aria-hidden />
        </button>
        </div>
      </div>
    </div>
  );
}
