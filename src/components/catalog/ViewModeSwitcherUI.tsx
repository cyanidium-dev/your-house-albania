"use client";

import { Icon } from "@/components/shared/Icon";
import { useTranslations } from "next-intl";
import type { ViewMode } from "@/lib/catalog/viewMode";
import { useCatalogViewOptional } from "@/contexts/CatalogViewContext";
import { segmentedItemClass, segmentedTrackClass } from "@/components/shared/Segmented";

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
        <div className={segmentedTrackClass("gap-0.5 p-0.5")}>
        <button
          type="button"
          onClick={() => setViewMode("large")}
          title={t("viewLarge")}
          className={segmentedItemClass(viewMode === "large", { size: "icon" })}
          aria-pressed={viewMode === "large"}
        >
          <Icon icon="ph:square" width={18} height={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("small")}
          title={t("viewSmall")}
          className={segmentedItemClass(viewMode === "small", { size: "icon" })}
          aria-pressed={viewMode === "small"}
        >
          <Icon icon="ph:squares-four" width={18} height={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          title={t("viewList")}
          className={segmentedItemClass(viewMode === "list", { size: "icon" })}
          aria-pressed={viewMode === "list"}
        >
          <Icon icon="ph:list" width={18} height={18} aria-hidden />
        </button>
        </div>
      </div>
    </div>
  );
}
