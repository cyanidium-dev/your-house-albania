/**
 * Seaside flats landings, one per market language (long-tail plan F2,
 * 2026-10-24): `/ru/nedvizhimost-v-albanii-u-morya` and
 * `/it/case-al-mare-albania`.
 *
 * Why these two: Russian and Italian are the second and third languages of
 * the site by impressions (1,425 and 1,670 in the 28 days to 2026-10-19)
 * and neither has a page for the "by the sea" intent that German
 * (`/de/immobilien-albanien-am-meer`), Polish and English already have.
 * Evidence: Ahrefs "недвижимость в албании у моря" 40 + "квартира у моря
 * албания" 20 a month, Search Console "купить квартиру в албании у моря",
 * "купить жилье в албании недорого" (position 10), "quanto costa una casa
 * in albania sul mare" 40 a month, "case in vendita albania sul mare" (4
 * impressions at position 35). Ukrainian waits until 2026-11-18: its
 * "біля моря" query lands on an E02 test page.
 *
 * One module, one view, a path per locale: the page is the same answer
 * (every flat within 1 km of the sea, by city, the cheapest first, costs,
 * FAQ) in that market's words. In code, like the hubs, because the Sanity
 * dataset is at its attribute cap. Copy: `messages/{ru,it}.json` `SeaFlats`.
 */
export const SEA_FLATS_PATHS: Readonly<Record<string, string>> = {
  ru: "nedvizhimost-v-albanii-u-morya",
  it: "case-al-mare-albania",
};

export const SEA_FLATS_LOCALES: readonly string[] = Object.keys(SEA_FLATS_PATHS);

/** The date the pages' copy last changed (sitemap `lastmod`). */
export const SEA_FLATS_LAST_MODIFIED = "2026-10-24";

export function seaFlatsPath(locale: string): string | null {
  const path = SEA_FLATS_PATHS[locale];
  return path ? `/${locale}/${path}` : null;
}

/** Flats, as the Price Index counts them. */
export const SEA_FLATS_TYPES: readonly string[] = ["apartment", "studio"];

/** A flat counts as "by the sea" within this stated walking distance, or on the first line. */
export const SEA_FLATS_MAX_METERS = 1000;

/** Cards on the page, and at most this many from one city while others have candidates. */
export const SEA_FLATS_CARDS = 12;
export const SEA_FLATS_PER_CITY = 4;
