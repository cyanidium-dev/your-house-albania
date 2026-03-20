/**
 * Builds Article, Author (Person), and Organization JSON-LD for blog detail pages.
 * Follows schema.org Article spec.
 */

export type BlogArticleJsonLdInput = {
  headline: string;
  description?: string;
  datePublished: string;
  imageUrl?: string;
  articleUrl: string;
  authorName: string;
  authorImageUrl?: string;
  publisherName: string;
  publisherUrl: string;
  publisherLogoUrl?: string;
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
    publisherLogoUrl,
  } = input;

  const baseUrl = publisherUrl.replace(/\/$/, "");
  const image = imageUrl
    ? toAbsoluteUrl(imageUrl, baseUrl)
    : undefined;

  const author: Record<string, unknown> = {
    "@type": "Person",
    name: authorName || "Unknown",
  };
  if (authorImageUrl) {
    const abs = toAbsoluteUrl(authorImageUrl, baseUrl);
    if (abs) author.image = abs;
  }

  const publisher: Record<string, unknown> = {
    "@type": "Organization",
    name: publisherName || "Site",
    url: publisherUrl,
  };
  if (publisherLogoUrl) {
    const abs = toAbsoluteUrl(publisherLogoUrl, baseUrl);
    if (abs) {
      publisher.logo = {
        "@type": "ImageObject",
        url: abs,
      };
    }
  }

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: headline || "Article",
    datePublished: datePublished || new Date().toISOString(),
    url: articleUrl,
    author,
    publisher,
  };
  if (description && description.trim()) {
    article.description = description.trim();
  }
  if (image) {
    article.image = image;
  }

  return article;
}
