import type { Metadata } from "next";

/**
 * Production SEO (indexing, hreflang, canonical, sitemap inventory) is opt-in.
 * Set `NEXT_PUBLIC_ENABLE_INDEXING=true` to enable; any other value or missing env → disabled.
 */
export function isIndexingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_INDEXING === "true";
}

/**
 * Robots for a page that may be indexed. `index, follow` is what a crawler
 * assumes anyway; the reason to spell it out is `max-image-preview:large`,
 * without which Google may show a listing's photos as thumbnails only — in
 * Images, in Discover and beside the result. Checked on production on
 * 2026-09-20: the directive was nowhere on the site.
 *
 * Every builder that decides indexability returns this rather than
 * `undefined`: Next.js replaces `robots` per key, so a page that returns
 * `robots: undefined` wipes the root layout's default instead of inheriting it.
 */
export const indexableRobots = {
  index: true,
  follow: true,
  "max-image-preview": "large",
} as const satisfies NonNullable<Metadata["robots"]>;

/** CMS `noIndex` / `noFollow` flags → robots. The decision is the caller's; only the image directive is added. */
export function robotsFromFlags(flags: { noIndex?: boolean; noFollow?: boolean }) {
  const noIndex = flags.noIndex === true;
  const noFollow = flags.noFollow === true;
  if (!noIndex && !noFollow) return indexableRobots;
  return {
    index: !noIndex,
    follow: !noFollow,
    ...(noIndex ? {} : { "max-image-preview": "large" as const }),
  };
}

/** Robots used when indexing is disabled (dev/preview unless explicitly enabled). */
export const indexingDisabledRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
};
