/**
 * Article JSON-LD for guide pages (`/[locale]/guides/[slug]`).
 *
 * Guides are the editorial content AI engines quote — comparisons like
 * "Saranda vs Ksamil", explainers like "buying". They already carry FAQPage
 * from the landing renderer, but nothing told a crawler what kind of document
 * they are, who stands behind them, or how fresh they are. Blog posts have had
 * that since `blogArticleJsonLd`; this closes the same gap for guides.
 *
 * `author` is the Organization on purpose. `landingPage` has no author field,
 * and inventing a named expert is exactly the fabrication CONTENT-OPS.md
 * forbids — these pages are written by the company, so the company is the
 * author. Swap in a Person once the schema carries one.
 */

import { organizationId } from "./siteJsonLd";

export type GuideArticleJsonLdInput = {
  headline: string;
  description?: string;
  /** Absolute URL of the guide. */
  articleUrl: string;
  imageUrl?: string;
  /** Editor-set review date (`contentUpdatedAt`), ISO or `YYYY-MM-DD`. */
  contentUpdatedAt?: string | null;
  /** Sanity's own `_updatedAt`. */
  documentUpdatedAt?: string | null;
  publisherName: string;
  /** Absolute site origin; also used to resolve relative image URLs. */
  publisherUrl: string;
  /** BCP-47-ish locale code, emitted as `inLanguage`. */
  locale?: string;
};

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url || typeof url !== "string") return "";
  if (isAbsoluteUrl(url)) return url;
  const base = baseUrl.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

function cleanDate(value: string | null | undefined): string | undefined {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return undefined;
  // `contentUpdatedAt` is a Sanity `date`, so it arrives as YYYY-MM-DD;
  // `_updatedAt` is a full timestamp. Both are valid schema.org dates.
  return Number.isNaN(Date.parse(s)) ? undefined : s;
}

/**
 * Returns the Article node, or `null` when the document carries no date at all.
 *
 * Emitting `datePublished: new Date()` would be a freshness claim we cannot
 * support — a page with no recorded date is better left without the block than
 * described with an invented one.
 */
export function buildGuideArticleJsonLd(
  input: GuideArticleJsonLdInput
): object | null {
  const {
    headline,
    description,
    articleUrl,
    imageUrl,
    contentUpdatedAt,
    documentUpdatedAt,
    publisherName,
    publisherUrl,
    locale,
  } = input;

  const editorDate = cleanDate(contentUpdatedAt);
  const systemDate = cleanDate(documentUpdatedAt);
  if (!editorDate && !systemDate) return null;

  const title = (headline || "").trim();
  if (!title) return null;

  const baseUrl = publisherUrl.replace(/\/$/, "");

  // Author and publisher are the same entity, and it is the one the layout
  // emits on this page — so both point at its `@id` instead of declaring two
  // more anonymous Organizations that a parser would have to guess are one.
  const organization = {
    "@type": "Organization",
    "@id": organizationId(baseUrl),
    name: publisherName || "Domlivo",
  };

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    url: articleUrl,
    // The editor's review date is the meaningful "published" signal here;
    // `_updatedAt` moves on any field change, including unrelated ones.
    datePublished: editorDate ?? systemDate,
    dateModified: systemDate ?? editorDate,
    author: organization,
    publisher: organization,
  };

  if (description && description.trim()) {
    article.description = description.trim();
  }
  if (imageUrl) {
    const abs = toAbsoluteUrl(imageUrl, baseUrl);
    if (abs) article.image = abs;
  }
  if (locale && locale.trim()) {
    article.inLanguage = locale.trim();
  }
  // Anchors the Article entity to its page, the same way the blog builder does.
  if (articleUrl) {
    article.mainEntityOfPage = { "@type": "WebPage", "@id": articleUrl };
  }

  return article;
}
