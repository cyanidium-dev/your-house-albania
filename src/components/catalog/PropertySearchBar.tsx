"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  useCatalogFilters,
  type PropertySearchBarProps,
} from "@/components/catalog/useCatalogFilters";
import { CatalogFilterForm } from "@/components/catalog/CatalogFilterForm";
import { CatalogFilterCompactBar } from "@/components/catalog/CatalogFilterCompactBar";
import { CatalogFilterCollapse } from "@/components/catalog/CatalogFilterCollapse";

export function PropertySearchBar(props: PropertySearchBarProps) {
  const t = useTranslations("Catalog.filters");
  const f = useCatalogFilters(props);
  const {
    dealTypeValues,
    deal,
    getDealLabel,
    applyCompactDealTab,
    mobileFilterModalOpen,
    setMobileFilterModalOpen,
    clientMounted,
    isCompact,
    collapsed,
    expandCompactFilters,
  } = f;

  return (
    <>
      {/* Mobile: single liquid-glass pill — deal tabs + filters icon (md:hidden). Modal toggle preserves existing portal/handlers. */}
      <div
        className={cn(
          "mb-5 flex min-h-11 w-full items-stretch gap-1 rounded-full p-1 md:hidden",
          "bg-white/40 backdrop-blur-xl backdrop-saturate-150 dark:bg-white/10",
          "border border-white/40 shadow-lg shadow-dark/5 ring-1 ring-inset ring-white/30 dark:border-white/15 dark:ring-white/10"
        )}
      >
        {/* Deal tabs only when there is a choice: with rentals hidden this row
            was a single "Buy" pill that did nothing. The pill then becomes one
            wide button that opens the filters. */}
        {dealTypeValues.length > 1 ? (
          <div
            className="flex min-w-0 flex-1 items-stretch gap-0.5"
            role="group"
            aria-label={t("dealType")}
          >
            {dealTypeValues.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => applyCompactDealTab(v)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center rounded-full px-2 py-1 text-center text-sm font-medium leading-tight transition-colors sm:text-base",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
                  deal === v
                    ? "bg-white text-dark shadow-sm dark:bg-dark dark:text-white"
                    : "text-dark/70 hover:bg-white/40 dark:text-white/80 dark:hover:bg-white/[0.08]"
                )}
              >
                <span className="min-w-0 truncate">{getDealLabel(v)}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMobileFilterModalOpen((o) => !o)}
            className={cn(
              "flex min-w-0 flex-1 items-center rounded-full px-3 text-left text-sm font-medium leading-tight transition-colors sm:text-base",
              "text-dark/70 hover:bg-white/40 dark:text-white/80 dark:hover:bg-white/[0.08]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
            )}
          >
            <span className="min-w-0 truncate">{t("filtersShort")}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setMobileFilterModalOpen((o) => !o)}
          aria-label={
            mobileFilterModalOpen ? t("closeModal") : t("mobileSearchOpen")
          }
          aria-expanded={mobileFilterModalOpen}
          className={cn(
            "flex w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
            mobileFilterModalOpen
              ? "bg-white text-primary shadow-sm dark:bg-dark dark:text-primary"
              : "text-dark/70 hover:bg-white/40 dark:text-white/80 dark:hover:bg-white/[0.08]"
          )}
        >
          <Icon icon="ph:sliders-horizontal" width={20} height={20} aria-hidden />
        </button>
      </div>
      {/* Desktop/tablet inline form only (md+). Hidden on mobile via CSS — same HTML on SSR/client, no hydration mismatch.
          On scroll-down it condenses to a compact summary pill (Airbnb-style); click to reopen the full form. */}
      <div className="mb-6 hidden min-w-0 md:block">
        <CatalogFilterCollapse
          compact={isCompact}
          collapsed={collapsed}
          form={<CatalogFilterForm placement="inline" filters={f} />}
          pill={
            <CatalogFilterCompactBar filters={f} onExpand={expandCompactFilters} />
          }
        />
      </div>
      {clientMounted &&
        mobileFilterModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99] flex flex-col justify-end md:hidden"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label={t("closeModal")}
              onClick={() => setMobileFilterModalOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-filter-modal-title"
              className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-dark/10 bg-white shadow-xl dark:border-white/10 dark:bg-dark"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dark/10 px-4 py-3 dark:border-white/10">
                <h2
                  id="catalog-filter-modal-title"
                  className="truncate text-lg font-semibold text-dark dark:text-white"
                >
                  {t("filtersShort")}
                </h2>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-dark/70 transition-colors hover:bg-dark/5 dark:text-white/80 dark:hover:bg-white/10"
                  onClick={() => setMobileFilterModalOpen(false)}
                  aria-label={t("closeModal")}
                >
                  <Icon icon="ph:x" width={22} height={22} aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 pb-6 pt-2">
                <CatalogFilterForm placement="modal" filters={f} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
