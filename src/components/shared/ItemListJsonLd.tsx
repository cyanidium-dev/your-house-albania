import { buildItemListJsonLd } from "@/lib/seo/itemListJsonLd";

export type ItemListEntry = {
  name: string;
  slug: string;
  image?: string | null;
};

type Props = {
  items: ItemListEntry[];
  baseUrl: string;
  locale: string;
};

export function ItemListJsonLd({ items, baseUrl, locale }: Props) {
  if (items.length === 0) return null;

  const jsonLd = buildItemListJsonLd(items, baseUrl, locale);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
