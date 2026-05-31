import { buildSiteJsonLd, type SiteJsonLdInput } from "@/lib/seo/siteJsonLd";

/**
 * Renders the site-wide Organization + WebSite JSON-LD as a single @graph.
 * Mount once on the homepage so the entity definitions live at the root URL.
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
