import { describe, expect, it } from "vitest";
import { defaultLocaleRedirectTarget } from "../localelessRedirect";

const LOCALES = ["en", "uk", "ru", "sq", "it", "pl", "de"] as const;

describe("defaultLocaleRedirectTarget", () => {
  it("sends a deep path without a locale to the default locale", () => {
    expect(defaultLocaleRedirectTarget("/blog/durres-reference-prices-2026", LOCALES, "sq")).toBe(
      "/sq/blog/durres-reference-prices-2026",
    );
    expect(defaultLocaleRedirectTarget("/albania/shengjin", LOCALES, "sq")).toBe("/sq/albania/shengjin");
    expect(defaultLocaleRedirectTarget("/sale", LOCALES, "sq")).toBe("/sq/sale");
  });

  it("leaves the root to language detection", () => {
    expect(defaultLocaleRedirectTarget("/", LOCALES, "sq")).toBeNull();
    expect(defaultLocaleRedirectTarget("", LOCALES, "sq")).toBeNull();
  });

  it("leaves every path that already names a locale alone", () => {
    expect(defaultLocaleRedirectTarget("/en", LOCALES, "sq")).toBeNull();
    expect(defaultLocaleRedirectTarget("/de/albania/durres", LOCALES, "sq")).toBeNull();
    expect(defaultLocaleRedirectTarget("/sq/blog/x", LOCALES, "sq")).toBeNull();
  });
});
