/**
 * Builds Article JSON-LD for blog detail pages: the article, its author and a
 * reference to the site's one Organization node as publisher.
 */
import { organizationId } from "./siteJsonLd";
import { isEditorialTeamAuthor } from "./editorialAuthor";
import { teamPersonNode } from "./teamPerson";

export type BlogArticleJsonLdInput = {
  headline: string;
  description?: string;
  datePublished: string;
  imageUrl?: string;
  articleUrl: string;
  authorName: string;
  authorImageUrl?: string;
  publisherName: string;
  /** Absolute site origin; also resolves relative image URLs and the `@id`. */
  publisherUrl: string;
  /** From the document's _updatedAt. Falls back to datePublished. */
  dateModified?: string;
  /** Slug of the linked blogAuthor. Absent for the legacy inline authors,
   *  which have no page to point at. */
  authorSlug?: string | null;
  locale?: string;
  /** A founder who checked the text (legal articles). Emitted as `contributor`. */
  reviewerName?: string | null;
  reviewerSlug?: string | null;
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

export function buildBlogArticleJsonLd(input: BlogArticleJsonLdInput): object {
  const {
    headline,
    description,
    datePublished,
    imageUrl,
    articleUrl,
    authorName,
    authorImageUrl,
    publisherName,
    publisherUrl,
    dateModified,
    authorSlug,
    locale,
    reviewerName,
    reviewerSlug,
  } = input;

  const baseUrl = publisherUrl.replace(/\/$/, "");
  const image = imageUrl
    ? toAbsoluteUrl(imageUrl, baseUrl)
    : undefined;

  // "Domlivo Editorial" is a byline for the team, not a human being. Typing it
  // as Person claimed an individual who does not exist; it is a department of
  // the organisation, and the people behind it are named on /about.
  const isTeamByline = isEditorialTeamAuthor({ name: authorName, slug: authorSlug });
  // A founder byline is the same Person the layout and /about describe: same
  // `@id`, so a parser joins the article to the person, their role and links.
  const founder = authorSlug ? teamPersonNode(baseUrl, authorSlug, locale) : null;
  const author: Record<string, unknown> = founder ?? {
    "@type": isTeamByline ? "Organization" : "Person",
    name: authorName || "Unknown",
  };
  if (authorImageUrl && !founder) {
    const abs = toAbsoluteUrl(authorImageUrl, baseUrl);
    if (abs) author.image = abs;
  }
  // Only a post with a blogAuthor reference has an author page to point at.
  // The 12 posts still on the legacy inline fields keep a bare Person node.
  if (founder) {
    // url, sameAs and image come from the founder record.
  } else if (isTeamByline) {
    author.parentOrganization = { "@id": organizationId(baseUrl) };
    if (locale) author.url = `${baseUrl}/${locale}/about`;
  } else if (authorSlug && locale) {
    author.url = `${baseUrl}/${locale}/blog/author/${authorSlug}`;
  }

  // Not a second Organization: a pointer at the node the layout emits on this
  // same page (logo, contact points and founders live there). The name stays
  // for consumers that read `publisher.name` without resolving the `@id`.
  const publisher: Record<string, unknown> = {
    "@type": "Organization",
    "@id": organizationId(baseUrl),
    name: publisherName || "Domlivo",
  };

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: headline || "Article",
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || datePublished || new Date().toISOString(),
    url: articleUrl,
    author,
    publisher,
  };
  if (description && description.trim()) {
    article.description = description.trim();
  }
  if (reviewerSlug || reviewerName) {
    const reviewer = reviewerSlug ? teamPersonNode(baseUrl, reviewerSlug, locale) : null;
    article.contributor = reviewer ?? { "@type": "Person", name: reviewerName };
  }
  if (image) {
    article.image = image;
  }
  // Six locales publish the same article at six URLs. Without inLanguage an
  // answer engine has to infer the language from the prose, and the guide
  // builder already states it — blog posts were the inconsistent half.
  if (locale && locale.trim()) {
    article.inLanguage = locale.trim();
  }
  // Anchors the Article entity to the page it lives on. Schema.org treats this
  // as the canonical link between the two, and answer engines use it to decide
  // which URL to cite for the claim.
  if (articleUrl) {
    article.mainEntityOfPage = { "@type": "WebPage", "@id": articleUrl };
  }

  return article;
}
