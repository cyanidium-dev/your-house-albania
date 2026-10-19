/**
 * Builds ItemList JSON-LD for schema.org catalog listing pages.
 * Uses absolute URLs when base is available.
 */
export type ItemListEntry = {
  name: string;
  /** Property slug. Ignored when `href` is set. */
  slug: string;
  /** Locale-prefixed path, for lists that are not property listings. */
  href?: string;
  image?: string | null;
};

/**
 * The page the list is on, when it is about a place: the city or district
 * catalogue. Emitted as a `CollectionPage` whose `mainEntity` is the list and
 * whose `about` is the `Place`, so a crawler reads "a page of listings in
 * Durrës" instead of an anonymous list.
 */
export type ItemListCollection = {
  name: string;
  /** Absolute canonical URL of the page, when known. */
  url?: string;
  placeName?: string;
};

export function buildItemListJsonLd(
  items: ItemListEntry[],
  baseUrl: string,
  locale: string,
  collection?: ItemListCollection | null
): object {
  const base = baseUrl.replace(/\/$/, "");

  const itemListElement = items
    .filter((item) => item.name && (item.slug || item.href))
    .map((item, idx) => {
      // Lists of anything other than properties pass an explicit path.
      const path = item.href ?? `/${locale}/property/${encodeURIComponent(item.slug)}`;
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

  const itemList = {
    "@type": "ItemList",
    numberOfItems: itemListElement.length,
    itemListElement,
  };
  if (!collection?.name) return { "@context": "https://schema.org", ...itemList };
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    ...(collection.url ? { url: collection.url } : {}),
    inLanguage: locale,
    ...(collection.placeName ? { about: { "@type": "Place", name: collection.placeName } } : {}),
    mainEntity: itemList,
  };
}
