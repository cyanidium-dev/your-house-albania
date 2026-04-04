import type { Metadata } from "next";

/**
 * Production SEO (indexing, hreflang, canonical, sitemap inventory) is opt-in.
 * Set `NEXT_PUBLIC_ENABLE_INDEXING=true` to enable; any other value or missing env → disabled.
 */
export function isIndexingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_INDEXING === "true";
}

/** Robots used when indexing is disabled (dev/preview unless explicitly enabled). */
export const indexingDisabledRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
};
