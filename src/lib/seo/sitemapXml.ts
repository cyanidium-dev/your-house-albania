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
};

const IMAGE_NAMESPACE = ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';

export function buildUrlsetXml(urls: SitemapUrl[]): string {
  let hasImages = false;
  // Every sitemap route loops over routing.locales; pages of a partly
  // translated locale that are noindex are dropped here, in one place.
  const items = urls
    .filter(({ loc }) => isSitePathIndexable(loc))
    .map(({ loc, lastmod, images }) => {
      const lm =
        lastmod && !Number.isNaN(lastmod.getTime())
          ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>`
          : "";
      // One line per image and no indentation: the property sitemap carries
      // thousands of these, and every byte is multiplied by seven locales.
      const imgs = (images ?? [])
        .filter((u) => typeof u === "string" && /^https?:\/\//.test(u))
        .map((u) => `\n<image:image><image:loc>${xmlEscape(u)}</image:loc></image:image>`)
        .join("");
      if (imgs) hasImages = true;
      return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lm}${imgs}\n  </url>`;
    })
    .join("\n");
  // Declared only when used, so the sitemaps without images stay byte-identical.
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasImages ? IMAGE_NAMESPACE : ""}>
${items}
</urlset>
`;
}
