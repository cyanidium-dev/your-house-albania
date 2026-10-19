/**
 * Structured data for a knowledge-base question page (`/[locale]/knowledge/[slug]`).
 *
 * The page answers one question with sourced figures, so it is an `Article`
 * whose `citation` lists the publications behind it, and — when it has at
 * least three question/answer pairs — an `FAQPage`.
 *
 * `author` is the founder who compiled the data, as the same Person node the
 * layout and /about emit (`teamPersonNode`), so the two are one entity.
 * `contributor` appears only once a reviewer has actually checked the page:
 * the CMS leaves `reviewedBy` empty until then, and markup must not claim a
 * review that has not happened. `dateModified` is the date printed on the
 * page, not Sanity's `_updatedAt`, which moves on every translation patch.
 */
import { organizationId } from "./siteJsonLd";
import { teamPersonNode } from "./teamPerson";

export type KnowledgeArticleJsonLdInput = {
  headline: string;
  description?: string;
  /** Absolute URL of the page. */
  url: string;
  locale: string;
  /** Visible "updated" date, YYYY-MM-DD. */
  lastUpdated?: string | null;
  /** Absolute site origin. */
  baseUrl: string;
  publisherName?: string;
  authorSlug?: string | null;
  reviewerSlug?: string | null;
  keywords?: string[];
  sources?: { name: string; url?: string | null; publisher?: string | null; publishedAt?: string | null }[];
};

const validDate = (value?: string | null): string | undefined =>
  value && !Number.isNaN(Date.parse(value)) ? value : undefined;

export function buildKnowledgeArticleJsonLd(input: KnowledgeArticleJsonLdInput): Record<string, unknown> | null {
  const headline = input.headline?.trim();
  const date = validDate(input.lastUpdated);
  if (!headline || !date) return null;

  const base = input.baseUrl.replace(/\/$/, "");
  const organization = {
    "@type": "Organization",
    "@id": organizationId(base),
    name: input.publisherName || "Domlivo",
  };

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    url: input.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    inLanguage: input.locale,
    datePublished: date,
    dateModified: date,
    author: (input.authorSlug && teamPersonNode(base, input.authorSlug, input.locale)) || organization,
    publisher: organization,
    isAccessibleForFree: true,
  };
  const reviewer = input.reviewerSlug ? teamPersonNode(base, input.reviewerSlug, input.locale) : null;
  if (reviewer) article.contributor = reviewer;
  if (input.description?.trim()) article.description = input.description.trim();
  if (input.keywords?.length) article.keywords = input.keywords.join(", ");

  const citations = (input.sources ?? [])
    .filter((s) => s?.name)
    .slice(0, 40)
    .map((s) => ({
      "@type": "CreativeWork",
      name: s.name,
      ...(s.url ? { url: s.url } : {}),
      ...(s.publisher ? { publisher: { "@type": "Organization", name: s.publisher } } : {}),
      ...(validDate(s.publishedAt) ? { datePublished: s.publishedAt } : {}),
    }));
  if (citations.length) article.citation = citations;

  return article;
}

/** FAQPage markup, only for three or more complete pairs. */
export function buildKnowledgeFaqJsonLd(
  faq: { question?: string | null; answer?: string | null }[],
): Record<string, unknown> | null {
  const pairs = faq.filter((f) => f.question?.trim() && f.answer?.trim());
  if (pairs.length < 3) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((f) => ({
      "@type": "Question",
      name: f.question!.trim(),
      acceptedAnswer: { "@type": "Answer", text: f.answer!.trim() },
    })),
  };
}
