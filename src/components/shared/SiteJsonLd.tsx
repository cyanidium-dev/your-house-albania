import { buildSiteJsonLd, type SiteJsonLdInput } from "@/lib/seo/siteJsonLd";

/**
 * Renders the site-wide Organization + WebSite JSON-LD as a single @graph.
 * Mounted once, in the locale layout, so every page carries the entity that
 * Article publishers, the founders and the About page reference by `@id`.
 */
export function SiteJsonLd(props: SiteJsonLdInput) {
  const json = buildSiteJsonLd(props);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
