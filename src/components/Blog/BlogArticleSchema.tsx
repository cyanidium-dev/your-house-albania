import { buildBlogArticleJsonLd } from "@/lib/seo/blogArticleJsonLd";
import type { BlogDetailData } from "@/lib/sanity/blogAdapter";

type Props = {
  detail: BlogDetailData;
  baseUrl: string;
  locale: string;
  siteName: string;
  siteLogoUrl?: string;
};

export function BlogArticleSchema({
  detail,
  baseUrl,
  locale,
  siteName,
  siteLogoUrl,
}: Props) {
  const base = baseUrl.replace(/\/$/, "");
  const articleUrl = base ? `${base}/${locale}/blogs/${detail.slug}` : `/${locale}/blogs/${detail.slug}`;
  const publisherUrl = base || "https://example.com";

  const datePublished =
    detail.publishedAt && !Number.isNaN(new Date(detail.publishedAt).getTime())
      ? new Date(detail.publishedAt).toISOString()
      : new Date().toISOString();

  const jsonLd = buildBlogArticleJsonLd({
    headline: detail.title,
    description: detail.excerpt || undefined,
    datePublished,
    imageUrl: detail.coverImageUrl || undefined,
    articleUrl,
    authorName: detail.authorName || "Unknown",
    authorImageUrl: detail.authorImageUrl || undefined,
    publisherName: siteName || "Site",
    publisherUrl,
    publisherLogoUrl: siteLogoUrl,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
