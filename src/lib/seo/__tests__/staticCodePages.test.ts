import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { buildUrlsetXml } from "../sitemapXml";
import { isLocalePathIndexable } from "../localeIndexing";
import { buildStaticCodePageEntries, STATIC_CODE_PAGES } from "../staticCodePages";
import { FOOTER_STABLE_NAV_ITEMS } from "@/data/footerNavConfig";

const BASE = "https://www.domlivo.com";

describe("static code pages in sitemap-static.xml", () => {
  it("lists /about", () => {
    expect(STATIC_CODE_PAGES.map((p) => p.path)).toContain("about");
  });

  // In no sitemap until the audit of 2026-10-18 (S-17).
  it("lists /contacts", () => {
    expect(STATIC_CODE_PAGES.map((p) => p.path)).toContain("contacts");
  });

  it("lists both calculator pages in every locale, French included", () => {
    const entries = buildStaticCodePageEntries(BASE, routing.locales, [
      { path: "calculators/purchase-costs", lastModified: "2026-10-21" },
    ]);
    const xml = buildUrlsetXml(entries);
    for (const locale of routing.locales) expect(xml).toContain(`<loc>${BASE}/${locale}/calculators/purchase-costs</loc>`);
    expect(STATIC_CODE_PAGES.map((p) => p.path)).toEqual(
      expect.arrayContaining(["calculators/purchase-costs", "calculators/rental-yield"]),
    );
  });

  it("emits one URL per locale, each with every locale plus x-default as alternates", () => {
    const entries = buildStaticCodePageEntries(BASE + "/", routing.locales, [
      { path: "about", lastModified: "2026-09-20" },
    ]);
    expect(entries.map((e) => e.loc)).toEqual(routing.locales.map((l) => `${BASE}/${l}/about`));
    for (const entry of entries) {
      expect(Object.keys(entry.alternates).sort()).toEqual([...routing.locales, "x-default"].sort());
      expect(entry.alternates["x-default"]).toBe(`${BASE}/en/about`);
      expect(entry.alternates.sq).toBe(`${BASE}/sq/about`);
    }
  });

  it("serialises the alternates as xhtml:link and declares the namespace", () => {
    const xml = buildUrlsetXml(buildStaticCodePageEntries(BASE, routing.locales));
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain(`<loc>${BASE}/de/about</loc>`);
    expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="pl" href="${BASE}/pl/about"/>`);
    expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/en/about"/>`);
    // A partial locale (fr) lists only its pilot pages: of the all-locale code
    // pages, just the two calculators.
    const indexable = (path: string) => routing.locales.filter((l) => isLocalePathIndexable(l, `/${path}`)).length;
    const expectedUrls = STATIC_CODE_PAGES.reduce((n, p) => n + (p.locales?.length ?? indexable(p.path)), 0);
    expect(xml.match(/<url>/g)).toHaveLength(expectedUrls);
  });

  // The German market hub (SEO hypothesis 3): one locale, so one URL, one alternate, x-default on itself.
  it("emits a single-locale page once, with that locale as its only alternate and x-default", () => {
    const entries = buildStaticCodePageEntries(BASE, routing.locales, [
      { path: "albanien-immobilien", lastModified: "2026-10-20", locales: ["de"] },
    ]);
    expect(entries.map((e) => e.loc)).toEqual([`${BASE}/de/albanien-immobilien`]);
    expect(entries[0].alternates).toEqual({
      de: `${BASE}/de/albanien-immobilien`,
      "x-default": `${BASE}/de/albanien-immobilien`,
    });
    expect(STATIC_CODE_PAGES.find((p) => p.path === "albanien-immobilien")?.locales).toEqual(["de"]);
  });

  it("leaves a sitemap without alternates exactly as it was", () => {
    const xml = buildUrlsetXml([{ loc: `${BASE}/en/blog` }]);
    expect(xml).not.toContain("xhtml");
  });
});

describe("footer navigation", () => {
  it("links the About page", () => {
    expect(FOOTER_STABLE_NAV_ITEMS.find((i) => i.key === "about")?.href).toBe("/about");
  });
});
