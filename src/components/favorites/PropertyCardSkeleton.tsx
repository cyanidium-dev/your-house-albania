"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-dark/10 dark:border-white/10 overflow-hidden">
      <Skeleton className="w-full aspect-[440/300] rounded-t-2xl" />
      <div className="p-6">
        <div className="flex flex-col mobile:flex-row gap-5 mobile:gap-0 justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-14" />
        </div>
      </div>
    </div>
  );
}
