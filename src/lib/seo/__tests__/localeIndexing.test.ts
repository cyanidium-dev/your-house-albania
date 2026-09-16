import { describe, expect, it } from "vitest";
import { isLocalePathIndexable, isPartialLocale, isSitePathIndexable } from "../localeIndexing";

describe("localeIndexing", () => {
  it("leaves complete locales alone", () => {
    expect(isPartialLocale("en")).toBe(false);
    expect(isLocalePathIndexable("en", "/blog/anything")).toBe(true);
    expect(isLocalePathIndexable("pl", "/guides/x")).toBe(true);
  });

  it("indexes only the translated sections of de", () => {
    expect(isPartialLocale("de")).toBe(true);
    for (const path of ["", "/", "/albania", "/albania/durres", "/albania/durres/near-the-sea", "/albania/durres/info", "/albania/durres/districts/golem-durres", "/property/some-flat", "/sale", "/cities"]) {
      expect(isLocalePathIndexable("de", path), path).toBe(true);
    }
    for (const path of ["/blog", "/blog/buying-in-durres", "/guides/golem-vs-plazh", "/knowledge", "/privacy", "/albanian", "/property/a/b"]) {
      expect(isLocalePathIndexable("de", path), path).toBe(false);
    }
  });

  it("ignores query strings and trailing slashes", () => {
    expect(isLocalePathIndexable("de", "/albania/durres/?page=2")).toBe(true);
    expect(isLocalePathIndexable("de", "/blog/?x=1")).toBe(false);
  });

  it("reads site pathnames and absolute URLs", () => {
    expect(isSitePathIndexable("/de/blog/post")).toBe(false);
    expect(isSitePathIndexable("https://www.domlivo.com/de/albania/durres")).toBe(true);
    expect(isSitePathIndexable("https://www.domlivo.com/en/blog/post")).toBe(true);
    expect(isSitePathIndexable("/api/og")).toBe(true);
  });
});
