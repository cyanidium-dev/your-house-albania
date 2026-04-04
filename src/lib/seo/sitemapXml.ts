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
  const items = urls
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
