import type { SitemapSimpleEntry } from "@/lib/sanity/queries/sitemap";
import { latestDate, parseDateOrUndefined } from "@/lib/seo/contentLastmod";
import type { SitemapUrl } from "@/lib/seo/sitemapXml";
import { buildStaticCodePageEntries } from "@/lib/seo/staticCodePages";

/**
 * `sitemap-priority.xml` — the short list a crawler should work through
 * before the 2,600 listing URLs.
 *
 * Search Console on 2026-09-23: 1,670 pages indexed, 2,168 "discovered,
 * currently not indexed". Google has every URL and crawls the site slowly;
 * with nine sitemaps of equal standing and a property file whose `lastmod`
 * was one bulk-import stamp, nothing told it where to start. This file is
 * listed first in the index and in robots.txt and holds only pages that earn
 * their crawl: the listing pages the registry indexes, the national sale
 * hubs, the city editorial pages, the about page, the two editorial indexes
 * and the newest blog posts. Every URL here is also in its own sitemap; a
 * URL may appear in more than one file.
 *
 * Pure: the route fetches, this arranges.
 */
export const PRIORITY_BLOG_POSTS = 10;

export type PrioritySitemapInput = {
  base: string;
  locales: readonly string[];
  /** Registry pages with `status` index/experiment, with the locales each is indexed in. */
  registryPages: readonly SitemapSimpleEntry[];
  /** Path after `/{locale}/` of the national sale hub. */
  saleHubSegment: string;
  /** Newest listing change site-wide — the sale hub lists every sale listing. */
  saleHubLastmod?: Date;
  cityInfo: ReadonlyArray<{ path: string; locales: readonly string[]; lastModified: string | null }>;
  blogPosts: ReadonlyArray<{ slug: string; lastModified: string | null }>;
  guides: ReadonlyArray<{ slug: string; locales: readonly string[]; lastModified: string | null }>;
};

const inLocale = (scope: readonly string[], locale: string): boolean => scope.length === 0 || scope.includes(locale);

/**
 * The posts the crawler should see first: newest by honest date, undated
 * ones last, ties by slug so the file is stable between regenerations.
 */
export function newestBlogPosts<T extends { slug: string; lastModified: string | null }>(posts: readonly T[], limit = PRIORITY_BLOG_POSTS): T[] {
  return [...posts]
    .sort((a, b) => {
      const ta = parseDateOrUndefined(a.lastModified)?.getTime() ?? 0;
      const tb = parseDateOrUndefined(b.lastModified)?.getTime() ?? 0;
      if (ta !== tb) return tb - ta;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    })
    .slice(0, limit);
}

export function buildPrioritySitemapUrls(input: PrioritySitemapInput): SitemapUrl[] {
  const base = input.base.replace(/\/$/, "");
  const seen = new Set<string>();
  const urls: SitemapUrl[] = [];
  const push = (loc: string, lastmod: Date | undefined) => {
    if (seen.has(loc)) return;
    seen.add(loc);
    urls.push({ loc, lastmod });
  };
  const join = (locale: string, segment: string) =>
    `${base}/${locale}/${segment
      .split("/")
      .filter(Boolean)
      .map((s) => encodeURIComponent(s))
      .join("/")}`;

  // 1. Listing pages the registry indexes, in the locales it indexes them.
  for (const page of input.registryPages) {
    for (const locale of input.locales) {
      if (page.locales && !page.locales.includes(locale)) continue;
      push(join(locale, page.segmentAfterLocale), page.lastModified);
    }
  }

  // 2. The national sale hub.
  for (const locale of input.locales) push(join(locale, input.saleHubSegment), input.saleHubLastmod);

  // 3. City editorial pages.
  for (const page of input.cityInfo) {
    for (const locale of input.locales) {
      if (!inLocale(page.locales, locale)) continue;
      push(join(locale, page.path), parseDateOrUndefined(page.lastModified));
    }
  }

  // 4. Pages that live in code only (/about), with their hreflang set.
  for (const entry of buildStaticCodePageEntries(base, input.locales)) {
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    urls.push(entry);
  }

  // 5. The guides index, where at least one guide exists in the locale (the
  //    page is `noindex` otherwise), dated by its newest guide.
  for (const locale of input.locales) {
    const own = input.guides.filter((g) => inLocale(g.locales, locale));
    if (own.length === 0) continue;
    push(join(locale, "guides"), latestDate(...own.map((g) => parseDateOrUndefined(g.lastModified))));
  }

  // 6. The blog index and the newest posts.
  const posts = newestBlogPosts(input.blogPosts);
  const blogLastmod = latestDate(...input.blogPosts.map((p) => parseDateOrUndefined(p.lastModified)));
  for (const locale of input.locales) {
    if (input.blogPosts.length === 0) break;
    push(join(locale, "blog"), blogLastmod);
  }
  for (const post of posts) {
    for (const locale of input.locales) {
      push(join(locale, `blog/${post.slug}`), parseDateOrUndefined(post.lastModified));
    }
  }

  return urls;
}
