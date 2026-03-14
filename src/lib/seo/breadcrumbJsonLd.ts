/**
 * Builds BreadcrumbList JSON-LD for schema.org.
 * Uses absolute URLs when base is available.
 */
export type BreadcrumbJsonLdItem = {
  name: string;
  url?: string;
};

export function buildBreadcrumbJsonLd(
  items: BreadcrumbJsonLdItem[],
  baseUrl: string
): object {
  const base = baseUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
      .filter((item) => item.name)
      .map((item, idx) => {
        const url = item.url;
        const fullUrl =
          base && url
            ? `${base}${url.startsWith("/") ? url : `/${url}`}`
            : undefined;
        return {
          "@type": "ListItem",
          position: idx + 1,
          name: item.name,
          ...(fullUrl && { item: fullUrl }),
        };
      }),
  };
}
