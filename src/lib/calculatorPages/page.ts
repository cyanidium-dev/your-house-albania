import type { Metadata } from "next";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { FRENCH_PILOT_CITY, frenchGuidePath } from "@/lib/frenchPilot/config";
import { CALCULATOR_PATHS, calculatorPath, type CalculatorKey } from "./config";

/** Messages lookup for `CalculatorPages` (next-intl's `t` with `has`). */
export type CalcPagesT = {
  (key: string, values?: Record<string, string | number>): string;
  has: (key: string) => boolean;
};

export function calculatorPageMetadata(args: {
  locale: string;
  key: CalculatorKey;
  title: string;
  description: string;
}): Metadata {
  return buildSimplePageMetadata({
    locale: args.locale,
    title: args.title,
    description: args.description,
    pathAfterLocale: CALCULATOR_PATHS[args.key],
    robots: { index: true, follow: true },
  });
}

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The plain HTML link other sites paste: `<a href="https://www.domlivo.com/{locale}/calculators/...">…</a>`. */
export function calculatorLinkSnippet(baseUrl: string, locale: string, key: CalculatorKey, text: string): string {
  return `<a href="${baseUrl.replace(/\/$/, "")}${calculatorPath(locale, key)}">${escapeHtml(text)}</a>`;
}

/** Cities with an editorial `/info` page in every locale. */
const CITY_INFO_PAGES = ["durres", "tirana", "vlore", "sarande"] as const;

/**
 * Related pages: the other calculator, prices by city, the buying guides and
 * the city pages. French links to the pilot's own pages (lib/frenchPilot),
 * the indexed ones of that locale. The city links go to `/info`, not to the
 * city listings, several of which are E02 control pages.
 */
export function calculatorRelatedLinks(locale: string, key: CalculatorKey, t: CalcPagesT) {
  const other: CalculatorKey = key === "purchase" ? "rental" : "purchase";
  const links = [
    { href: calculatorPath(locale, other), label: t(other === "purchase" ? "shared.related.purchaseCalc" : "shared.related.rentalCalc") },
    { href: `/${locale}/prices`, label: t("shared.related.prices") },
  ];
  if (locale === "fr") {
    links.push(
      { href: frenchGuidePath("buying"), label: t("shared.related.frenchGuide") },
      {
        href: `/fr/albania/${FRENCH_PILOT_CITY}`,
        label: t("shared.related.cityListings", { city: t(`shared.cities.${FRENCH_PILOT_CITY}`) }),
      },
    );
    return links;
  }
  links.push(
    { href: `/${locale}/blog/legal-guide-buyers`, label: t("shared.related.guideLegal") },
    { href: `/${locale}/blog/can-foreigners-buy-real-estate-albania`, label: t("shared.related.guideForeigners") },
    ...CITY_INFO_PAGES.map((city) => ({
      href: `/${locale}/albania/${city}/info`,
      label: t("shared.related.city", { city: t(`shared.cities.${city}`) }),
    })),
  );
  return links;
}

/** `t` that returns `null` for a key the locale's messages do not have. */
export function optionalT(t: CalcPagesT) {
  return (key: string, values?: Record<string, string | number>) => (t.has(key) ? t(key, values) : null);
}
