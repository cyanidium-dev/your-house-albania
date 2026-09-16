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
  it("has no partial locale today: de is complete", () => {
    expect(PARTIAL_LOCALE_PATHS).toEqual({});
    expect(isPartialLocale("de")).toBe(false);
    expect(isLocalePathIndexable("de", "/blog/buying-in-durres")).toBe(true);
    expect(isSitePathIndexable("/de/guides/golem-vs-plazh")).toBe(true);
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
