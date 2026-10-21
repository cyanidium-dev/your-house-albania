/**
 * The two standalone calculator pages (2026-10-21): link magnets that other
 * sites (expat blogs, journalists) can cite, one for the costs of buying and
 * one for the rental yield.
 *
 * They reuse the landing calculators (`PurchaseCostCalcSection`,
 * `RoiCalcSection`) and read their figures from one landing in Sanity, so an
 * editor who changes a fee there changes it on these pages too. The page copy
 * (H1, lead, method, FAQ) lives in `messages/*.json` → `CalculatorPages`.
 */
export const CALCULATORS_SEGMENT = "calculators";

export const CALCULATOR_PATHS = {
  purchase: `${CALCULATORS_SEGMENT}/purchase-costs`,
  rental: `${CALCULATORS_SEGMENT}/rental-yield`,
} as const;

export type CalculatorKey = keyof typeof CALCULATOR_PATHS;

/** The Sanity landing whose `purchaseCostCalcSection` and `roiCalcSection` the pages render. */
export const CALCULATOR_SOURCE_LANDING_SLUG = "property-for-sale-albania-by-the-sea";

/** The date the pages' copy last changed (sitemap `lastmod`). */
export const CALCULATOR_PAGES_LAST_MODIFIED = "2026-10-21";

/** Price of the worked example in the purchase FAQ, EUR (the calculator opens at the same price). */
export const PURCHASE_EXAMPLE_PRICE_EUR = 100_000;

/**
 * Price of the worked example in the rental FAQ, EUR: the €110,000
 * one-bedroom flat in Durrës that the ROI presets in Sanity were estimated
 * for (the section's subtitle on the source landing).
 */
export const RENTAL_EXAMPLE_PRICE_EUR = 110_000;

export function calculatorPath(locale: string, key: CalculatorKey): string {
  return `/${locale}/${CALCULATOR_PATHS[key]}`;
}
