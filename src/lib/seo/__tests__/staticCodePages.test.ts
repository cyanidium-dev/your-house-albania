import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { buildUrlsetXml } from "../sitemapXml";
import { buildStaticCodePageEntries, STATIC_CODE_PAGES } from "../staticCodePages";
import { FOOTER_STABLE_NAV_ITEMS } from "@/data/footerNavConfig";

const BASE = "https://www.domlivo.com";

describe("static code pages in sitemap-static.xml", () => {
  it("lists /about", () => {
    expect(STATIC_CODE_PAGES.map((p) => p.path)).toContain("about");
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
    expect(xml.match(/<url>/g)).toHaveLength(routing.locales.length);
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
