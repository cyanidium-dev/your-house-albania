import * as React from "react";
import BlogSmall from "@/components/shared/Blog";
import { resolveLocalizedString } from "@/lib/sanity/localized";

function hasUsableSlug(p: unknown): boolean {
  if (!p || typeof p !== "object") return false;
  const s = (p as { slug?: string | { current?: string } }).slug;
  if (typeof s === "string" && s.trim().length > 0) return true;
  if (s && typeof s === "object") {
    return ((s as { current?: string }).current ?? "").trim().length > 0;
  }
  return false;
}

/**
 * CMS `articlesSection` on property documents (same shape as landing).
 * Renders only when section has content; no empty chrome.
 */
export function PropertyArticlesSection({
  locale,
  section,
}: {
  locale: string;
  section: unknown;
}) {
  if (!section || typeof section !== "object") return null;

  const s = section as Record<string, unknown>;
  const modeRaw = String(s.mode ?? "").toLowerCase();
  const posts = s.posts;
  const hasPosts =
    Array.isArray(posts) && posts.length > 0 && posts.some((p) => hasUsableSlug(p));

  if (modeRaw === "selected" || modeRaw === "manual") {
    if (!hasPosts) return null;
  }

  const title =
    resolveLocalizedString(s.title as never, locale)?.trim() || undefined;
  const subtitle =
    resolveLocalizedString(s.subtitle as never, locale)?.trim() || undefined;
  const ctaRaw = s.cta as { href?: string; label?: unknown } | undefined;
  const ctaHref = typeof ctaRaw?.href === "string" ? ctaRaw.href : undefined;
  const ctaLabel = resolveLocalizedString(ctaRaw?.label as never, locale) || undefined;
  const cardCtaLabel =
    resolveLocalizedString(s.cardCtaLabel as never, locale)?.trim() || undefined;

  const cta =
    ctaHref || ctaLabel ? { href: ctaHref, label: ctaLabel } : undefined;

  const effectivePosts = modeRaw === "latest" ? undefined : (posts as never);

  return (
    <BlogSmall
      locale={locale}
      posts={effectivePosts}
      title={title}
      subtitle={subtitle}
      cta={cta}
      mode={modeRaw || undefined}
      manualArticleTitles={
        Array.isArray(s.manualArticleTitles) ? s.manualArticleTitles : undefined
      }
      cardCtaLabel={cardCtaLabel}
    />
  );
}
