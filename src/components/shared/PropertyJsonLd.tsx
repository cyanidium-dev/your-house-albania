import { buildPropertyJsonLd } from "@/lib/seo/propertyJsonLd";

export type PropertyJsonLdInput = {
  name: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  price?: number | null;
  currency?: string | null;
  status?: string | null;
  beds?: number;
  baths?: number;
  area?: number;
  imageUrls: string[];
  baseUrl: string;
  locale: string;
};

type Props = PropertyJsonLdInput;

export function PropertyJsonLd(props: Props) {
  const jsonLd = buildPropertyJsonLd(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
