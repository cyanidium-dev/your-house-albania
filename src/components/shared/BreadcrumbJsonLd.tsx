import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumbJsonLd";

type Props = {
  items: { name: string; url?: string }[];
  baseUrl: string;
};

export function BreadcrumbJsonLd({ items, baseUrl }: Props) {
  if (items.length === 0) return null;

  const jsonLd = buildBreadcrumbJsonLd(items, baseUrl);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
