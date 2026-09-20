import { describe, expect, it } from "vitest";
import { currentCityListingHref } from "../currentCityListing";

const LOCALES = ["en", "sq", "de"];

describe("currentCityListingHref", () => {
  it("keeps the visitor in the city they are browsing", () => {
    for (const p of [
      "/en/albania/durres",
      "/en/albania/durres/golem-durres",
      "/en/albania/durres/1-1",
      "/en/albania/durres/info",
      "/en/albania/durres/districts/plazh",
    ]) {
      expect(currentCityListingHref(p, LOCALES, ["albania"]), p).toBe("/en/albania/durres#listings");
    }
  });

  it("leaves every other page on the generic target", () => {
    for (const p of ["/en", "/en/albania", "/en/blog/some-post/x", "/en/property/flat/x", "/en/catalog", "/xx/albania/durres", null]) {
      expect(currentCityListingHref(p, LOCALES, ["albania"]), String(p)).toBeNull();
    }
  });

  it("requires a known country when the countries are known", () => {
    expect(currentCityListingHref("/en/durres/sale/apartment", LOCALES, ["albania"])).toBeNull();
    expect(currentCityListingHref("/en/albania/durres", LOCALES)).toBe("/en/albania/durres#listings");
  });
});
