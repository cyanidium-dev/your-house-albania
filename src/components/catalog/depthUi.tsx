import * as React from "react";
import { cn } from "@/lib/utils";
import { PANEL } from "@/components/shared/layout";

/**
 * Pieces shared by the blocks under a listing grid (city and district pages,
 * the national /sale hub). They were two copies of the same class strings.
 */
export const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-dark/10 dark:border-white/20 px-3.5 py-2 text-sm font-medium text-dark dark:text-white";
export const chipLinkClass = `${chipClass} hover:border-primary hover:text-primary transition-colors`;
export const countClass = "text-dark/50 dark:text-white/50 tabular-nums";
export const textLinkClass = "text-primary font-medium underline-offset-4 hover:underline";
export const subheadClass = "text-sm font-semibold text-dark/70 dark:text-white/70";
export const noteClass = "text-xs text-dark/50 dark:text-white/50";

/** Key figures as a row of panels: the same surface as the zone figures on /info. */
export function StatTiles({
  stats,
  className,
}: {
  stats: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}) {
  if (stats.length === 0) return null;
  return (
    <dl
      className={cn(
        "grid gap-3 md:gap-4",
        stats.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : stats.length === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2",
        className,
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label} className={cn(PANEL, "p-5 md:p-6")}>
          <dt className="text-sm text-dark/60 dark:text-white/60">{stat.label}</dt>
          <dd className="mt-2 font-display text-2xl md:text-3xl font-medium tracking-tight text-dark dark:text-white tabular-nums">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
