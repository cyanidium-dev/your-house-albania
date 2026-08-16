import { isIndexingEnabled } from "@/lib/seo/envSeo";

export type PlaceJsonLdProps = {
  name: string;
  description?: string;
  /** Absolute page URL. */
  url: string;
  imageUrl?: string;
  /** The city a district sits in; omitted for a city itself. */
  containedIn?: { name: string; url: string };
  baseUrl: string;
};

/**
 * `Place` for a district or city page.
 *
 * District pages carried only a BreadcrumbList, which says where the page sits
 * but nothing about what it is. `Place` with `containedInPlace` states the
 * geography the breadcrumb only implies, and gives the description and photo
 * something to attach to.
 */
export function PlaceJsonLd({
  name,
  description,
  url,
  imageUrl,
  containedIn,
  baseUrl,
}: PlaceJsonLdProps) {
  if (!isIndexingEnabled()) return null;

  const abs = (path: string) => (path.startsWith("http") ? path : `${baseUrl}${path}`);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name,
    url: abs(url),
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(containedIn
      ? {
          containedInPlace: {
            "@type": "Place",
            name: containedIn.name,
            url: abs(containedIn.url),
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
