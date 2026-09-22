import { describe, expect, it } from "vitest";
import { buildUrlsetXml } from "../sitemapXml";
import { buildPropertySitemapXml, planPropertySitemapUrls, sortPropertySitemapRows, SITEMAP_IMAGES_PER_URL } from "../propertySitemap";
import { sitemapImageUrls } from "@/lib/sanity/queries/sitemap";

const BASE = "https://www.domlivo.com";
const asset = (n: number) => `https://cdn.sanity.io/images/p/production/${"a".repeat(39)}${n}-1280x753.jpg`;

describe("buildUrlsetXml", () => {
  it("stays a plain urlset when no URL carries images", () => {
    const xml = buildUrlsetXml([{ loc: `${BASE}/en/about`, lastmod: new Date("2026-09-01T00:00:00Z") }]);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).not.toContain("image:");
    expect(xml).toContain("<lastmod>2026-09-01T00:00:00.000Z</lastmod>");
  });

  it("declares the image namespace and escapes the query string", () => {
    const xml = buildUrlsetXml([
      { loc: `${BASE}/en/property/x`, images: [`${asset(1)}/apartment-durres-1.jpg?w=1600&fit=max&auto=format&q=75`, "/relative.jpg"] },
    ]);
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain(
      `<image:image><image:loc>${asset(1)}/apartment-durres-1.jpg?w=1600&amp;fit=max&amp;auto=format&amp;q=75</image:loc></image:image>`,
    );
    // Only absolute URLs are valid in <image:loc>.
    expect(xml).not.toContain("relative.jpg");
    expect(xml.match(/<image:image>/g)).toHaveLength(1);
  });
});

describe("sitemapImageUrls", () => {
  it("publishes the canonical named variant and keeps gallery positions", () => {
    expect(sitemapImageUrls([asset(1), null, asset(3)], "apartment-1-1-plazh-durres")).toEqual([
      `${asset(1)}/apartment-1-1-plazh-durres-1.jpg?w=1600&fit=max&auto=format&q=75`,
      `${asset(3)}/apartment-1-1-plazh-durres-3.jpg?w=1600&fit=max&auto=format&q=75`,
    ]);
    expect(sitemapImageUrls(undefined, "x")).toEqual([]);
  });
});

describe("buildPropertySitemapXml", () => {
  const rows = [
    {
      slug: "flat-one",
      localizedSlug: { de: "wohnung-eins" },
      lastModified: new Date("2026-09-01T00:00:00Z"),
      images: Array.from({ length: 9 }, (_, i) => `${asset(i)}/apartment-durres-${i + 1}.jpg?w=1600&fit=max&auto=format&q=75`),
    },
    { slug: "no-photos", localizedSlug: null, lastModified: new Date("2026-09-02T00:00:00Z"), images: [] },
  ];

  it("lists up to six photos under every locale URL of a listing", () => {
    const xml = buildPropertySitemapXml({ base: BASE, locales: ["en", "de"], rows });
    expect(xml.match(/<url>/g)).toHaveLength(4);
    expect(xml).toContain(`<loc>${BASE}/de/property/wohnung-eins</loc>`);
    expect(xml.match(/<image:image>/g)).toHaveLength(2 * SITEMAP_IMAGES_PER_URL);
    expect(xml).toContain("apartment-durres-6.jpg");
    expect(xml).not.toContain("apartment-durres-7.jpg");
  });

  it("sheds photos rather than outgrow the response budget", () => {
    const full = buildPropertySitemapXml({ base: BASE, locales: ["en", "de"], rows });
    const tight = buildPropertySitemapXml({ base: BASE, locales: ["en", "de"], rows, maxBytes: full.length - 1 });
    expect(tight.match(/<image:image>/g)).toHaveLength(2 * (SITEMAP_IMAGES_PER_URL - 1));
    const none = buildPropertySitemapXml({ base: BASE, locales: ["en", "de"], rows, maxBytes: 10 });
    expect(none).not.toContain("image:");
    expect(none.match(/<url>/g)).toHaveLength(4);
  });
});

describe("planPropertySitemapUrls", () => {
  const complete = { slug: "complete-old", localizedSlug: null, lastModified: new Date("2026-01-01T00:00:00Z"), images: [asset(1)], complete: true };
  const completeNew = { slug: "complete-new", localizedSlug: null, lastModified: new Date("2026-06-01T00:00:00Z"), images: [asset(2)], complete: true };
  const bare = { slug: "bare", localizedSlug: null, lastModified: new Date("2026-09-01T00:00:00Z"), images: [], complete: false };
  const undated = { slug: "undated", localizedSlug: null, images: [asset(3)], complete: true };

  it("puts complete listings first, newest first, and undated ones last among them", () => {
    expect(sortPropertySitemapRows([bare, complete, undated, completeNew]).map((r) => r.slug)).toEqual([
      "complete-new",
      "complete-old",
      "undated",
      "bare",
    ]);
  });

  it("lists every locale of a listing together and omits lastmod it does not know", () => {
    const { urls } = planPropertySitemapUrls({ base: BASE, locales: ["en", "de"], rows: [bare, undated], imagesPerUrl: 1 });
    expect(urls.map((u) => u.loc)).toEqual([
      `${BASE}/en/property/undated`,
      `${BASE}/de/property/undated`,
      `${BASE}/en/property/bare`,
      `${BASE}/de/property/bare`,
    ]);
    expect(urls[0].lastmod).toBeUndefined();
    expect(buildUrlsetXml(urls.slice(0, 1))).not.toContain("<lastmod>");
  });

  it("drops the locale URLs whose page would be the English fallback", () => {
    const rows = [
      { ...complete, ownTextLocales: ["en", "sq"] },
      { ...completeNew, ownTextLocales: ["en", "sq", "de"] },
      bare, // no `ownTextLocales` → every locale
    ];
    const { urls, droppedFallbackUrls } = planPropertySitemapUrls({ base: BASE, locales: ["en", "sq", "de"], rows, imagesPerUrl: 0 });
    expect(droppedFallbackUrls).toBe(1);
    expect(urls.map((u) => u.loc)).not.toContain(`${BASE}/de/property/complete-old`);
    expect(urls.map((u) => u.loc)).toContain(`${BASE}/de/property/complete-new`);
    expect(urls).toHaveLength(8);
  });
});
