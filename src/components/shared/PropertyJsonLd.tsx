import { buildPropertyJsonLd, type PropertyJsonLdInput } from "@/lib/seo/propertyJsonLd";

// Re-exported rather than re-declared: the local copy of this type is how the
// component drifted from the builder in the first place, carrying a `currency`
// field the schema had already dropped.
export type { PropertyJsonLdInput };

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
