import { describe, expect, it } from "vitest";
import {
  isLocalePathIndexable,
  isPartialLocale,
  isSitePathIndexable,
  PARTIAL_LOCALE_PATHS,
  type PartialLocalePaths,
} from "../localeIndexing";

// The shape de launched with on 2026-09-16, as a fixture for the mechanism.
const PARTIAL_DE: PartialLocalePaths = {
  de: [/^$/, /^\/albania(\/.*)?$/, /^\/sale(\/.*)?$/, /^\/rent(\/.*)?$/, /^\/property\/[^/]+$/, /^\/cities(\/[^/]+)?$/],
};

describe("localeIndexing", () => {
  it("has one partial locale today, the French pilot; de is complete", () => {
    expect(Object.keys(PARTIAL_LOCALE_PATHS)).toEqual(["fr"]);
    expect(isPartialLocale("fr")).toBe(true);
    expect(isPartialLocale("de")).toBe(false);
    expect(isLocalePathIndexable("de", "/blog/buying-in-durres")).toBe(true);
    expect(isSitePathIndexable("/de/guides/golem-vs-plazh")).toBe(true);
  });

  it("indexes only the French pilot pages", () => {
    expect(isSitePathIndexable("/fr/immobilier-albanie")).toBe(true);
    expect(isSitePathIndexable("/fr/immobilier-albanie/acheter-depuis-la-france")).toBe(true);
    expect(isSitePathIndexable("/fr/albania/durres")).toBe(true);
    expect(isSitePathIndexable("/fr/albania/durres/plazh")).toBe(true);
    expect(isSitePathIndexable("/fr/property/appartement-1-1-mali-i-robit-durres-72m2")).toBe(true);
    expect(isSitePathIndexable("/fr/calculators/purchase-costs")).toBe(true);
    expect(isSitePathIndexable("/fr/calculators/rental-yield")).toBe(true);
    expect(isSitePathIndexable("/fr/calculators")).toBe(false);
    expect(isSitePathIndexable("/fr")).toBe(false);
    expect(isSitePathIndexable("/fr/albania/durres/qerret")).toBe(false);
    expect(isSitePathIndexable("/fr/albania/durres/districts")).toBe(false);
    expect(isSitePathIndexable("/fr/albania/tirana")).toBe(false);
    expect(isSitePathIndexable("/fr/property/apartment-1-1-golem-durres-64m2")).toBe(false);
    expect(isSitePathIndexable("/fr/blog/legal-guide-buyers")).toBe(false);
    expect(isSitePathIndexable("/fr/immobilier-albanie/autre")).toBe(false);
  });

  it("leaves complete locales alone", () => {
    expect(isPartialLocale("en", PARTIAL_DE)).toBe(false);
    expect(isLocalePathIndexable("en", "/blog/anything", PARTIAL_DE)).toBe(true);
  });

  it("indexes only the listed sections of a partial locale", () => {
    expect(isPartialLocale("de", PARTIAL_DE)).toBe(true);
    for (const path of ["", "/", "/albania", "/albania/durres", "/albania/durres/near-the-sea", "/albania/durres/info", "/property/some-flat", "/sale", "/cities"]) {
      expect(isLocalePathIndexable("de", path, PARTIAL_DE), path).toBe(true);
    }
    for (const path of ["/blog", "/blog/buying-in-durres", "/guides/golem-vs-plazh", "/privacy", "/albanian", "/property/a/b"]) {
      expect(isLocalePathIndexable("de", path, PARTIAL_DE), path).toBe(false);
    }
  });

  it("ignores query strings and trailing slashes", () => {
    expect(isLocalePathIndexable("de", "/albania/durres/?page=2", PARTIAL_DE)).toBe(true);
    expect(isLocalePathIndexable("de", "/blog/?x=1", PARTIAL_DE)).toBe(false);
  });

  it("reads site pathnames and absolute URLs", () => {
    expect(isSitePathIndexable("/de/blog/post", PARTIAL_DE)).toBe(false);
    expect(isSitePathIndexable("https://www.domlivo.com/de/albania/durres", PARTIAL_DE)).toBe(true);
    expect(isSitePathIndexable("https://www.domlivo.com/en/blog/post", PARTIAL_DE)).toBe(true);
    expect(isSitePathIndexable("/api/og", PARTIAL_DE)).toBe(true);
  });
});
