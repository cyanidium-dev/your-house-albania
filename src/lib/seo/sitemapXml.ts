import { isSitePathIndexable } from "@/lib/seo/localeIndexing";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapIndexXml(absoluteSitemapUrls: string[]): string {
  const items = absoluteSitemapUrls
    .map((loc) => `  <sitemap><loc>${xmlEscape(loc)}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

export type SitemapUrl = {
  loc: string;
  lastmod?: Date;
  /** Absolute image URLs shown on the page — Google's image sitemap extension. */
  images?: string[];
  /**
   * hreflang → absolute URL (`x-default` included). An alternate whose target
   * is not indexable is dropped, the same way the URL itself would be.
   */
  alternates?: Record<string, string>;
};

const IMAGE_NAMESPACE = ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
const XHTML_NAMESPACE = ' xmlns:xhtml="http://www.w3.org/1999/xhtml"';

export function buildUrlsetXml(urls: SitemapUrl[]): string {
  let hasImages = false;
  // Every sitemap route loops over routing.locales; pages of a partly
  // translated locale that are noindex are dropped here, in one place.
  const kept = urls.filter(({ loc }) => isSitePathIndexable(loc));
  const items = kept
    .map(({ loc, lastmod, images, alternates }) => {
      const lm =
        lastmod && !Number.isNaN(lastmod.getTime())
          ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>`
          : "";
      const links = Object.entries(alternates ?? {})
        .filter(([, href]) => isSitePathIndexable(href))
        .map(
          ([hreflang, href]) =>
            `\n    <xhtml:link rel="alternate" hreflang="${xmlEscape(hreflang)}" href="${xmlEscape(href)}"/>`
        )
        .join("");
      // One line per image and no indentation: the property sitemap carries
      // thousands of these, and every byte is multiplied by seven locales.
      const imgs = (images ?? [])
        .filter((u) => typeof u === "string" && /^https?:\/\//.test(u))
        .map((u) => `\n<image:image><image:loc>${xmlEscape(u)}</image:loc></image:image>`)
        .join("");
      if (imgs) hasImages = true;
      return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lm}${links}${imgs}\n  </url>`;
    })
    .join("\n");
  // Each namespace is declared only by a sitemap that uses it, so the others
  // stay byte-identical.
  const xhtmlNs = kept.some((u) => u.alternates && Object.keys(u.alternates).length > 0)
    ? XHTML_NAMESPACE
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xhtmlNs}${hasImages ? IMAGE_NAMESPACE : ""}>
${items}
</urlset>
`;
}
