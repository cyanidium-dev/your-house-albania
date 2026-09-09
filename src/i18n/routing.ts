import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "uk", "ru", "sq", "it", "pl"],
  defaultLocale: "sq",
  localePrefix: "always",
  /**
   * next-intl sets a `Link: rel="alternate"` response header on every request
   * unless this is off. The app already emits hreflang in the HTML head, via
   * `buildHreflangAlternates`, and the two sets disagreed:
   *
   *   header — all six locales, unconditionally, and no `x-default`
   *   HTML   — the locales the page actually has, plus `x-default`
   *
   * Crawlers read both channels and merge them, so every page declared each
   * language twice ("more than one page for the same language", 2,337 URLs in
   * the Ahrefs crawl of 2026-09-10), and pages that exist in one locale — the
   * nine Polish-only guides — had five 404 siblings announced for them
   * ("hreflang to redirect or broken page", 2,367 URLs).
   *
   * The HTML set is the correct one: it is the only one that knows about
   * `landingPage.locales` and about `x-default`. Google treats one channel as
   * sufficient, so the header goes.
   */
  alternateLinks: false,
});
