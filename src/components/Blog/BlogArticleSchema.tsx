import { buildBlogArticleJsonLd } from "@/lib/seo/blogArticleJsonLd";
import type { BlogDetailData } from "@/lib/sanity/blogAdapter";
import { fetchPriceIndexSnapshot } from "@/lib/sanity/client";
import { buildEditionDatasetJsonLd, parsePriceIndexEditionSlug } from "@/lib/priceIndex/jsonLd";
import { findIndexCity } from "@/lib/priceIndex/snapshot";
import { placeName } from "@/lib/priceIndex/publish";

type Props = {
  detail: BlogDetailData;
  baseUrl: string;
  locale: string;
  siteName: string;
};

/**
 * A monthly price-index edition (`durres-asking-price-index-2026-10`) is also
 * a Dataset of its month, linked to the methodology and the index catalog, so
 * each edition is a distinct, citable version. Its figures are the post's own
 * (the excerpt states them); the city is named from the live index.
 */
async function editionDataset(detail: BlogDetailData, baseUrl: string, articleUrl: string, datePublished: string, dateModified?: string) {
  const edition = parsePriceIndexEditionSlug(detail.slug);
  if (!edition) return null;
  const snapshot = await fetchPriceIndexSnapshot();
  const city = findIndexCity(snapshot, edition.citySlug);
  return buildEditionDatasetJsonLd({
    baseUrl,
    articleUrl,
    edition,
    cityName: city ? placeName(city.title, city.slug) : edition.citySlug,
    description: detail.excerpt || undefined,
    datePublished,
    dateModified,
  });
}

export async function BlogArticleSchema({
  detail,
  baseUrl,
  locale,
  siteName,
}: Props) {
  const base = baseUrl.replace(/\/$/, "");
  const articleUrl = base ? `${base}/${locale}/blog/${detail.slug}` : `/${locale}/blog/${detail.slug}`;
  const publisherUrl = base || "https://example.com";

  const datePublished =
    detail.publishedAt && !Number.isNaN(new Date(detail.publishedAt).getTime())
      ? new Date(detail.publishedAt).toISOString()
      : new Date().toISOString();

  const dateModified =
    detail.updatedAt && !Number.isNaN(new Date(detail.updatedAt).getTime())
      ? new Date(detail.updatedAt).toISOString()
      : undefined;

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
    dateModified,
    authorSlug: detail.authorSlug,
    reviewerName: detail.reviewerName,
    reviewerSlug: detail.reviewerSlug,
    locale,
  });

  const dataset = await editionDataset(detail, base, articleUrl, datePublished, dateModified);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {dataset ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset).replace(/</g, "\\u003c") }}
        />
      ) : null}
    </>
  );
}
