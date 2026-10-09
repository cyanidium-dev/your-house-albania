/**
 * Builds BreadcrumbList JSON-LD for schema.org.
 * Uses absolute URLs when base is available.
 *
 * Google requires `item` (the URL) on every ListItem except the last one
 * (the page itself). A crumb in the middle of the trail without a URL made the
 * whole list invalid in Search Console ("Missing field item", 2026-10-09), so
 * such crumbs are left out of the structured data — the visible breadcrumb
 * still shows them — and positions are renumbered.
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
  const absolute = (url: string | undefined) =>
    url
      ? /^https?:\/\//.test(url)
        ? url
        : base
          ? `${base}${url.startsWith("/") ? url : `/${url}`}`
          : undefined
      : undefined;

  const named = items.filter((item) => item.name);
  const kept = named
    .map((item, idx) => ({ name: item.name, url: absolute(item.url), last: idx === named.length - 1 }))
    .filter((item) => item.url || item.last);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: kept.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}
