import * as React from "react";
import BlogSmall from "@/components/shared/Blog";

function hasUsableSlug(p: unknown): boolean {
  if (!p || typeof p !== "object") return false;
  const s = (p as { slug?: string | { current?: string } }).slug;
  if (typeof s === "string" && s.trim().length > 0) return true;
  if (s && typeof s === "object") {
    return ((s as { current?: string }).current ?? "").trim().length > 0;
  }
  return false;
}

export type PropertyArticlesSectionSlice = {
  enabled?: boolean;
  posts?: unknown[];
};

/**
 * Property document `articlesSection`: manual posts only (`enabled` + `posts`).
 * Section heading, subheading, and CTA copy come from `Home.blog` via `BlogSmall`.
 */
export function PropertyArticlesSection({
  locale,
  section,
}: {
  locale: string;
  section: unknown;
}) {
  if (!section || typeof section !== "object") return null;

  const s = section as PropertyArticlesSectionSlice;
  if (s.enabled === false) return null;

  const posts = s.posts;
  const hasPosts =
    Array.isArray(posts) &&
    posts.length > 0 &&
    posts.some((p) => hasUsableSlug(p));
  if (!hasPosts) return null;

  return (
    <BlogSmall
      locale={locale}
      posts={posts}
      manualOnly
    />
  );
}
