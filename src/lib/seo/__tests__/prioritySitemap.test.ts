import { describe, expect, it } from "vitest";
import { buildPrioritySitemapUrls, newestBlogPosts, PRIORITY_BLOG_POSTS } from "../prioritySitemap";
import { buildUrlsetXml } from "../sitemapXml";

const BASE = "https://www.domlivo.com";
const LOCALES = ["en", "de", "pl"] as const;

const input = {
  base: BASE,
  locales: LOCALES,
  registryPages: [
    { segmentAfterLocale: "albania/durres", lastModified: new Date("2026-09-21T09:00:00Z"), locales: ["en", "de", "pl"] },
    { segmentAfterLocale: "albania/sarande", lastModified: undefined, locales: ["en", "de"] },
  ],
  saleHubSegment: "sale",
  saleHubLastmod: new Date("2026-09-21T09:00:00Z"),
  cityInfo: [
    { path: "albania/durres/info", locales: [], lastModified: "2026-09-10T00:00:00.000Z" },
    { path: "albania/vlore/info", locales: ["en"], lastModified: null },
  ],
  blogPosts: Array.from({ length: 12 }, (_, i) => ({
    slug: `post-${String(i).padStart(2, "0")}`,
    lastModified: i === 11 ? null : `2026-08-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
  })),
  guides: [{ slug: "buying", locales: ["pl"], lastModified: "2026-07-01T00:00:00.000Z" }],
};

describe("newestBlogPosts", () => {
  it("takes the ten newest by honest date, undated last", () => {
    const picked = newestBlogPosts(input.blogPosts);
    expect(picked).toHaveLength(PRIORITY_BLOG_POSTS);
    expect(picked[0].slug).toBe("post-10");
    expect(picked.map((p) => p.slug)).not.toContain("post-11");
    expect(picked.map((p) => p.slug)).not.toContain("post-00");
  });
});

describe("buildPrioritySitemapUrls", () => {
  const urls = buildPrioritySitemapUrls(input);
  const locs = urls.map((u) => u.loc);

  it("starts with the registry pages in the locales they are indexed in", () => {
    expect(locs.slice(0, 5)).toEqual([
      `${BASE}/en/albania/durres`,
      `${BASE}/de/albania/durres`,
      `${BASE}/pl/albania/durres`,
      `${BASE}/en/albania/sarande`,
      `${BASE}/de/albania/sarande`,
    ]);
    expect(locs).not.toContain(`${BASE}/pl/albania/sarande`);
    expect(urls[0].lastmod?.toISOString()).toBe("2026-09-21T09:00:00.000Z");
    expect(urls[3].lastmod).toBeUndefined();
  });

  it("adds the sale hubs, the city info pages in scope and /about with hreflang", () => {
    expect(locs).toContain(`${BASE}/pl/sale`);
    expect(locs).toContain(`${BASE}/pl/albania/durres/info`);
    expect(locs).toContain(`${BASE}/en/albania/vlore/info`);
    expect(locs).not.toContain(`${BASE}/de/albania/vlore/info`);
    const about = urls.find((u) => u.loc === `${BASE}/de/about`);
    expect(about?.alternates?.["x-default"]).toBe(`${BASE}/en/about`);
  });

  it("lists the guides index only where a guide exists, and the blog index with the newest posts", () => {
    expect(locs).toContain(`${BASE}/pl/guides`);
    expect(locs).not.toContain(`${BASE}/en/guides`);
    expect(urls.find((u) => u.loc === `${BASE}/pl/guides`)?.lastmod?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(urls.find((u) => u.loc === `${BASE}/en/blog`)?.lastmod?.toISOString()).toBe("2026-08-11T00:00:00.000Z");
    expect(locs.filter((l) => /\/blog\/post-/.test(l))).toHaveLength(PRIORITY_BLOG_POSTS * LOCALES.length);
    expect(locs).not.toContain(`${BASE}/en/blog/post-11`);
  });

  it("never repeats a URL and renders as a plain urlset", () => {
    expect(new Set(locs).size).toBe(locs.length);
    const xml = buildUrlsetXml(urls);
    expect(xml.match(/<url>/g)).toHaveLength(locs.length);
    expect(xml).not.toContain("image:");
  });
});
