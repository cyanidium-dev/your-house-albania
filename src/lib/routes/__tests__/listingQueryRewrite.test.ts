import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  LISTING_QUERY_SEGMENT,
  NON_LISTING_FIRST_SEGMENTS,
  hasListingQuery,
  isGeoListingPathname,
  listingQueryPublicPathname,
  listingQueryRewritePathname,
} from "../listingQueryRewrite";

const LOCALES = ["en", "uk", "ru", "sq", "it", "pl", "de"] as const;
const q = (s: string) => new URLSearchParams(s);

describe("listingQueryRewritePathname", () => {
  it("leaves a path-only listing URL on the cached route", () => {
    expect(listingQueryRewritePathname("/en/albania/durres", q(""), LOCALES)).toBeNull();
    expect(listingQueryRewritePathname("/en/albania/durres/golem-durres/1-1", q(""), LOCALES)).toBeNull();
  });

  it("sends pagination, filters and sort to the query route", () => {
    expect(listingQueryRewritePathname("/en/albania/durres", q("page=2"), LOCALES)).toBe(
      `/en/${LISTING_QUERY_SEGMENT}/albania/durres`,
    );
    expect(listingQueryRewritePathname("/sq/albania/durres/sale/apartment", q("minPrice=50000&sort=price-asc"), LOCALES)).toBe(
      `/sq/${LISTING_QUERY_SEGMENT}/albania/durres/sale/apartment`,
    );
    // Country omitted: still the listing route.
    expect(listingQueryRewritePathname("/en/durres/sale", q("beds=2"), LOCALES)).toBe(
      `/en/${LISTING_QUERY_SEGMENT}/durres/sale`,
    );
  });

  it("serves the cached page to a visit that only carries tracking parameters", () => {
    expect(listingQueryRewritePathname("/en/albania/durres", q("utm_source=x&utm_medium=cpc&gclid=abc"), LOCALES)).toBeNull();
    expect(listingQueryRewritePathname("/en/albania/durres", q("fbclid=1&page=2"), LOCALES)).not.toBeNull();
  });

  it("ignores empty values, as the page's noindex rule does", () => {
    expect(hasListingQuery(q("page="))).toBe(false);
    expect(hasListingQuery(q("page=1"))).toBe(true);
  });

  it("never touches other routes", () => {
    for (const p of [
      "/en",
      "/en/albania",
      "/en/albania/durres/info",
      "/en/albania/durres/districts",
      "/en/albania/durres/districts/golem-durres",
      "/en/blog/some-post/extra",
      "/en/property/some-flat/x",
      "/en/agent/someone/albania/durres",
      "/en/sale/apartment/x",
      "/xx/albania/durres",
      `/en/${LISTING_QUERY_SEGMENT}/albania/durres`,
    ]) {
      expect(listingQueryRewritePathname(p, q("page=2"), LOCALES), p).toBeNull();
    }
  });
});

describe("isGeoListingPathname", () => {
  it("excludes every static folder of app/[locale]", () => {
    const dir = path.join(process.cwd(), "src", "app", "[locale]");
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("[") && !d.name.startsWith("(") && !d.name.startsWith("_"))
      .map((d) => d.name);
    expect(folders.length).toBeGreaterThan(10);
    for (const name of folders) {
      expect(NON_LISTING_FIRST_SEGMENTS.has(name), `add "${name}" to NON_LISTING_FIRST_SEGMENTS`).toBe(true);
      expect(isGeoListingPathname(`/en/${name}/a/b`, LOCALES)).toBe(false);
    }
  });

  it("excludes the static children of [country]/[city]", () => {
    const dir = path.join(process.cwd(), "src", "app", "[locale]", "[country]", "[city]");
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("["))
      .map((d) => d.name);
    for (const name of folders) {
      expect(isGeoListingPathname(`/en/albania/durres/${name}`, LOCALES), name).toBe(false);
    }
  });
});

describe("listingQueryPublicPathname", () => {
  it("maps the internal path back to the public one", () => {
    expect(listingQueryPublicPathname(`/en/${LISTING_QUERY_SEGMENT}/albania/durres/1-1`, LOCALES)).toBe("/en/albania/durres/1-1");
    expect(listingQueryPublicPathname(`/en/${LISTING_QUERY_SEGMENT}`, LOCALES)).toBe("/en");
    expect(listingQueryPublicPathname("/en/albania/durres", LOCALES)).toBeNull();
  });
});
