/**
 * The investment hub, `/{locale}/investment` (2026-10-24): one page per
 * market language for "buy a flat in Albania as an investment".
 *
 * Why: the investment plan of 2026-10-08 (docs/seo/INVESTMENT-LANDINGS-PLAN)
 * defined this hub and nobody built it; `/investment` answered 404 while the
 * blog carried six investment articles and the site had a yield calculator.
 * Search Console shows the intent only where we rank ("invest in apartments
 * in tirana", position 5.5); the plan's SERP review found no page in any of
 * our languages that puts live prices, rents, yields, taxes and the
 * no-golden-visa fact on one URL. This page does, from the Price Index, the
 * long-term rents data sheet and the calculator's model, and sends the reader
 * to the flats that fit the brief and to the lead form.
 *
 * In code like the other hubs (the Sanity dataset is at its attribute cap).
 * Copy: `messages/*.json` `InvestmentHub` in `INVESTMENT_HUB_LOCALES`.
 */
export const INVESTMENT_HUB_PATH = "investment";

/** The locales the hub is written in; every other locale renders 404. */
export const INVESTMENT_HUB_LOCALES: readonly string[] = ["en", "uk", "ru", "de", "pl", "it"];

/** The date the page's copy last changed (sitemap `lastmod`). */
export const INVESTMENT_HUB_LAST_MODIFIED = "2026-10-24";

export function investmentHubPath(locale: string): string {
  return `/${locale}/${INVESTMENT_HUB_PATH}`;
}

/**
 * Advertised long-term rents of a one-bedroom flat, EUR a month, from the
 * data sheet "Long-term residential rents in Albania, 2026" (Sanity
 * knowledgeArticle, Century 21 H1 2026 and portal samples; achieved rents run
 * 5-10 % lower). The yield column divides twelve months of this by the live
 * median price of a 1+1 in the Price Index, so the rent is the only figure
 * on the page that is not computed live. Re-check with the data sheet.
 */
export const INVESTMENT_HUB_RENTS: Readonly<Record<string, { min: number; max: number }>> = {
  tirana: { min: 450, max: 650 },
  durres: { min: 250, max: 400 },
  vlore: { min: 300, max: 450 },
  sarande: { min: 380, max: 450 },
  shengjin: { min: 250, max: 430 },
};

/** The cities of the table, in this order; others with listings follow. */
export const INVESTMENT_HUB_LEAD_CITIES: readonly string[] = ["durres", "shengjin", "tirana", "vlore", "sarande"];

/** The cards: flats by the sea up to this total price, best €/m² against their city first. */
export const INVESTMENT_HUB_MAX_PRICE = 120_000;
export const INVESTMENT_HUB_CARDS = 12;
export const INVESTMENT_HUB_PER_CITY = 4;

/** Articles linked from the page (Sanity `blogPost` slugs, every locale). */
export const INVESTMENT_HUB_ARTICLES: readonly string[] = [
  "durres-rental-investment-2026",
  "albania-property-types-investment-risk",
  "albania-bulgaria-montenegro-seaside-flat",
  "albania-montenegro-croatia-property-comparison",
];

/** The investment guide (Sanity `landingPage`, `/guides/investment-albania`). */
export const INVESTMENT_HUB_GUIDE_SLUG = "investment-albania";

/** Rental income tax, % (Albania, long and short lets). */
export const RENTAL_INCOME_TAX_PCT = 15;
