/**
 * Builds ItemList JSON-LD for schema.org catalog listing pages.
 * Uses absolute URLs when base is available.
 */
export type ItemListEntry = {
  name: string;
  slug: string;
  image?: string | null;
};

export function buildItemListJsonLd(
  items: ItemListEntry[],
  baseUrl: string,
  locale: string
): object {
  const base = baseUrl.replace(/\/$/, "");

  const itemListElement = items
    .filter((item) => item.name && item.slug)
    .map((item, idx) => {
      const path = `/${locale}/property/${encodeURIComponent(item.slug)}`;
      const url = base ? `${base}${path}` : path;
      const listItem: Record<string, unknown> = {
        "@type": "ListItem",
        position: idx + 1,
        url,
        name: item.name,
      };
      if (item.image && typeof item.image === "string" && item.image.startsWith("http")) {
        listItem.image = item.image;
      } else if (item.image && typeof item.image === "string" && base) {
        listItem.image = item.image.startsWith("/") ? `${base}${item.image}` : `${base}/${item.image}`;
      }
      return listItem;
    });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: itemListElement.length,
    itemListElement,
  };
}
