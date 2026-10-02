/**
 * Is this browser a search or AI crawler rendering the page?
 *
 * Googlebot renders pages in a tall headless Chrome, so every `<Link>` on a
 * page is "in the viewport" and Next.js prefetches all of them: on
 * /en/albania/durres that is 109 `?_rsc=` requests per rendered page. In
 * Search Console those showed up as 70% of all crawl requests ("other file
 * type", 2026-10-02), each one a Vercel function invocation that teaches
 * Google nothing: the HTML already carries the whole page.
 *
 * The site's `Link` (components/shared/Link) turns prefetch off when this
 * returns true. Only crawlers that execute JavaScript matter here; the rest
 * never run this code. Lighthouse and other lab tools are deliberately not
 * listed, so the numbers they report stay those of a real visitor.
 */
const CRAWLER_RE =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|BingPreview|Applebot|DuckDuckBot|YandexBot|Baiduspider|Slurp|GPTBot|ChatGPT-User|OAI-SearchBot|PerplexityBot|ClaudeBot|Claude-User|Amazonbot|Bytespider|PetalBot|AhrefsBot|SemrushBot|facebookexternalhit|LinkedInBot/i;

let cached: boolean | null = null;

export function isCrawlerUserAgent(userAgent: string): boolean {
  return CRAWLER_RE.test(userAgent);
}

/** False on the server and in every ordinary browser; memoised per page load. */
export function isCrawlerClient(): boolean {
  if (cached !== null) return cached;
  if (typeof navigator === "undefined") return false;
  cached = isCrawlerUserAgent(navigator.userAgent || "");
  return cached;
}
