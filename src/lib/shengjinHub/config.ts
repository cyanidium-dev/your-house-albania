/**
 * The Shëngjin hub, `/{locale}/shengjin`: one page in every locale for the
 * "cheap flat by the sea in Albania" intent, answered with the town where the
 * site has the stock for it (2026-10-22).
 *
 * On 21-22.10.2026 a local developer's catalogue took Shëngjin from 20 to
 * 123 sale listings (102 flats), the second seaside market of the site after
 * Durrës and the cheapest with a reliable sample: a median of about
 * €1,300/m² against €1,500 in Durrës and €2,000+ in Sarandë and Vlorë. The
 * search results for the town were holiday rentals and two aggregators with
 * a handful of flats each, and the answer engines quoted €1,650-2,600/m²
 * from those. The hub puts the live figures, the cheapest flats by the sea,
 * the buying costs and a FAQ on one URL that the city listing page, the
 * property pages and the footer link.
 *
 * Lives in code, like the German hub and the partner landings, because the
 * Sanity dataset sits at its attribute cap (docs/HANDOVER.md). The town's
 * name is the path in every locale: it is the keyword in each of them.
 * Copy: `messages/*.json` `ShengjinHub`.
 */
export const SHENGJIN_HUB_PATH = "shengjin";

/** The date the page's copy last changed (sitemap `lastmod`). */
export const SHENGJIN_HUB_LAST_MODIFIED = "2026-10-22";

export const SHENGJIN_CITY = "shengjin";
export const SHENGJIN_COUNTRY = "albania";

export function shengjinHubPath(locale: string): string {
  return `/${locale}/${SHENGJIN_HUB_PATH}`;
}

/**
 * The seaside cities the comparison table sets Shëngjin against, in this
 * order; a city without a listing is left out, a median under the headline
 * sample is printed with its sample and the "indicative" mark.
 */
export const SHENGJIN_COMPARE_CITIES: readonly string[] = ["shengjin", "durres", "vlore", "sarande", "tirana"];

/** Flats by the sea: this many cards. */
export const SHENGJIN_SEA_LISTINGS = 12;

/** A listing counts as "by the sea" within this stated walking distance, or on the first line. */
export const SHENGJIN_SEA_MAX_METERS = 1000;

/** Flats, as the Price Index counts them. */
export const SHENGJIN_FLAT_TYPES: readonly string[] = ["apartment", "studio"];

/** The price ceilings of the budget table, EUR, ascending. */
export const SHENGJIN_BUDGET_CEILINGS: readonly number[] = [50_000, 80_000, 100_000];

/** The facet pages the hub links when the registry indexes them in the locale. */
export const SHENGJIN_HUB_FACETS = ["near-the-sea", "under-100k", "1-1", "2-1"] as const;

/**
 * The two comparisons the site already has for the town (Sanity `landingPage`
 * guides, every locale), linked under the FAQ.
 */
export const SHENGJIN_GUIDE_SLUGS: readonly string[] = ["shengjin-vs-durres", "velipoja-vs-shengjin"];
