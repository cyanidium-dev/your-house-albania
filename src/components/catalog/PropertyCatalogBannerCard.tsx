"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PropertyCatalogBanner } from "@/types/propertyCatalogBanner";

export function PropertyCatalogBannerCard({
  banner,
  className,
}: {
  banner: PropertyCatalogBanner;
  className?: string;
}) {
  // Phase 1 temporary top-block rule: prefer imageBig, fallback to imageSmall.
  const imageUrl = banner.imageBigUrl || banner.imageSmallUrl;
  const imageAlt = banner.imageBigAlt || banner.imageSmallAlt || "Property";
  return (
    <Link
      href={banner.href}
      className={cn(
        "group block min-w-0 overflow-hidden rounded-2xl border border-dark/10 dark:border-white/10",
        "hover:shadow-3xl dark:hover:shadow-white/10 transition-shadow",
        className
      )}
    >
      {/* CMS note: use wide landscape assets (~3:1 to 4:1). Very tall images will be cropped by object-cover. */}
      <div className="relative w-full aspect-[4/1] bg-dark/5 dark:bg-white/10">
        <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover" loading="lazy" />
      </div>
    </Link>
  );
}

