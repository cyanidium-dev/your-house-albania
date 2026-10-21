/**
 * SEO lab experiment E02 (2026-10-21): contextual links from the pages that
 * already earn clicks to commercial pages stuck at positions 10-35.
 *
 * Test and control pages were split at random in matched pairs (same type
 * and impression level, GSC 22.09-19.10); only the test half is linked from
 * here. The control half must not be added to this map until the review, or
 * the comparison is lost. Design, lists and review date:
 * reports/domlivo-seo-lab/backlog.md (E02) and experiments.json.
 *
 * Keys are source paths without the domain (`/{locale}/blog/{slug}`,
 * `/{locale}/guides/{slug}`, `/{locale}/albania/{city}/info`); a source only
 * links to pages in its own locale.
 */

export type SeoLabLink = { href: string; anchor: string };

export const SEO_LAB_EXPERIMENT_E02 = {
  id: "E02-striking-distance-links",
  startedAt: "2026-10-21",
  reviewAt: "2026-11-18",
} as const;

const RU_DURRES: SeoLabLink = {
  href: "/ru/albania/durres",
  anchor: "Квартиры в Дурресе у моря: цены за м² и объявления",
};
const UK_BUY: SeoLabLink = {
  href: "/uk/kupyty-kvartyru-v-albanii",
  anchor: "Купити квартиру в Албанії біля моря",
};
const UK_DURRES_PRICES: SeoLabLink = {
  href: "/uk/albania/durres/info",
  anchor: "Ціни на квартири в Дурресі за районами",
};
const EN_TIRANA: SeoLabLink = { href: "/en/albania/tirana", anchor: "Property for sale in Tirana" };
const EN_SARANDE: SeoLabLink = { href: "/en/albania/sarande", anchor: "Apartments for sale in Sarandë" };
const PL_DURRES: SeoLabLink = { href: "/pl/albania/durres", anchor: "Mieszkania na sprzedaż w Durrës" };
const PL_DURRES_DISTRICTS: SeoLabLink = {
  href: "/pl/albania/durres/districts",
  anchor: "Dzielnice Durrës: ceny za m² i gdzie kupić",
};
const SQ_DURRES: SeoLabLink = { href: "/sq/albania/durres", anchor: "Apartamente në shitje në Durrës" };
const SQ_OKAZION: SeoLabLink = {
  href: "/sq/apartamente-ne-shitje-durres-okazion",
  anchor: "Apartamente me okazion në Durrës",
};
const SQ_SALE: SeoLabLink = { href: "/sq/sale", anchor: "Prona në shitje në Shqipëri" };

export const SEO_LAB_LINKS: Readonly<Record<string, readonly SeoLabLink[]>> = {
  "/ru/blog/retiring-to-albania-property-costs": [RU_DURRES],
  "/ru/blog/moving-to-albania-with-family": [RU_DURRES],
  "/ru/blog/can-foreigners-buy-real-estate-albania": [RU_DURRES],
  "/ru/blog/tirana-durres-train-property-prices": [RU_DURRES],
  "/ru/guides/durres-vs-vlore": [RU_DURRES],

  "/uk/blog/albania-protests-2026-what-is-happening": [UK_BUY, UK_DURRES_PRICES],
  "/uk/guides/albania-vs-montenegro": [UK_BUY, UK_DURRES_PRICES],
  "/uk/guides/albania-vs-croatia": [UK_BUY, UK_DURRES_PRICES],
  "/uk/guides/durres-vs-vlore": [UK_DURRES_PRICES, UK_BUY],

  "/en/blog/legal-guide-buyers": [EN_TIRANA, EN_SARANDE],
  "/en/blog/albania-property-market-h1-2026": [EN_TIRANA, EN_SARANDE],
  "/en/blog/market-outlook-2026": [EN_TIRANA, EN_SARANDE],
  "/en/blog/how-to-choose-tirana-durres-vlore": [EN_TIRANA],

  "/pl/guides/czy-polak-moze-kupic-mieszkanie-w-albanii": [PL_DURRES, PL_DURRES_DISTRICTS],
  "/pl/guides/czy-warto-kupic-mieszkanie-w-albanii": [PL_DURRES, PL_DURRES_DISTRICTS],
  "/pl/guides/tanie-mieszkania-w-albanii": [PL_DURRES],
  "/pl/blog/legal-guide-buyers": [PL_DURRES, PL_DURRES_DISTRICTS],
  "/pl/blog/retiring-to-albania-property-costs": [PL_DURRES, PL_DURRES_DISTRICTS],

  "/sq/blog/durres-reference-prices-2026": [SQ_DURRES, SQ_OKAZION, SQ_SALE],
  "/sq/blog/legal-guide-buyers": [SQ_DURRES, SQ_SALE],
  "/sq/blog/durres-documents-checklist": [SQ_DURRES, SQ_OKAZION],
  "/sq/albania/tirana/info": [SQ_SALE],
};

export function seoLabLinksFor(path: string): readonly SeoLabLink[] {
  return SEO_LAB_LINKS[path] ?? [];
}
