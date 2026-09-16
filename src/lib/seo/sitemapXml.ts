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

export function buildUrlsetXml(
  urls: Array<{ loc: string; lastmod?: Date }>
): string {
  // Every sitemap route loops over routing.locales; pages of a partly
  // translated locale that are noindex are dropped here, in one place.
  const items = urls
    .filter(({ loc }) => isSitePathIndexable(loc))
    .map(({ loc, lastmod }) => {
      const lm =
        lastmod && !Number.isNaN(lastmod.getTime())
          ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>`
          : "";
      return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lm}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}
