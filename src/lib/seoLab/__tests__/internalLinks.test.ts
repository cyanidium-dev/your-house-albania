import { describe, it, expect } from "vitest";
import { SEO_LAB_LINKS } from "../internalLinks";

// The control half of experiment E02 (reports/domlivo-seo-lab/experiments.json).
// Linking any of these before the review would erase the comparison.
const E02_CONTROL = [
  "/ru/kupit-kvartiru-v-albanii",
  "/en/albania/durres",
  "/it/albania/tirana/districts",
  "/pl/albania/sarande",
  "/en/albania/shengjin",
  "/pl/nieruchomosci-albania-nad-morzem",
  "/uk/albania/durres",
  "/uk/albania/tirana/districts",
  "/it/albania/vlore",
];

describe("SEO_LAB_LINKS", () => {
  const entries = Object.entries(SEO_LAB_LINKS);

  it("links only within the source locale", () => {
    for (const [source, links] of entries) {
      const locale = source.split("/")[1];
      for (const link of links) expect(link.href.split("/")[1], `${source} -> ${link.href}`).toBe(locale);
    }
  });

  it("never links a control page of E02", () => {
    const targets = entries.flatMap(([, links]) => links.map((l) => l.href));
    for (const control of E02_CONTROL) expect(targets).not.toContain(control);
  });

  it("has no duplicate target on one page", () => {
    for (const [source, links] of entries) {
      expect(new Set(links.map((l) => l.href)).size, source).toBe(links.length);
    }
  });
});
