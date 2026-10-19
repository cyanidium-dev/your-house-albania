import { buildItemListJsonLd, type ItemListCollection } from "@/lib/seo/itemListJsonLd";

export type ItemListEntry = {
  name: string;
  slug: string;
  /** Locale-prefixed path, for lists that are not property listings. */
  href?: string;
  image?: string | null;
};

type Props = {
  items: ItemListEntry[];
  baseUrl: string;
  locale: string;
  /** The place page the list belongs to (city, district); plain ItemList without it. */
  collection?: ItemListCollection | null;
};

export function ItemListJsonLd({ items, baseUrl, locale, collection = null }: Props) {
  if (items.length === 0) return null;

  const jsonLd = buildItemListJsonLd(items, baseUrl, locale, collection);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
