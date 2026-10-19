import { getTranslations } from "next-intl/server";
import { fetchCityListingPriceIndex } from "@/lib/sanity/client";
import { formatMoney } from "@/lib/currency/format";
import { placePriceFacts } from "@/lib/catalog/listingDepth";

export type PlaceAnswer = {
  /** One sentence under the listing heading: the median, the sample, the date. */
  line: string;
  /** The same figure for the meta description, shorter. */
  meta: string;
};

/**
 * The first thing a city or district catalogue page says, in figures: the
 * median asking price per m², the sample and the date. Commercial pages sat
 * at position 17 with 168 impressions (ru-Durrës, GSC 2026-10) while the
 * figures lived only on /info and at the foot of the page; a searcher — and
 * an answer engine — reads the first paragraph (SEO hypothesis 2, 2026-10-19).
 * `null` when the place has too few flats for a median.
 */
export async function placeAnswer(input: {
  locale: string;
  citySlug: string;
  districtSlug?: string | null;
  placeIn: string;
}): Promise<PlaceAnswer | null> {
  let facts: ReturnType<typeof placePriceFacts> = null;
  try {
    facts = placePriceFacts(await fetchCityListingPriceIndex(input.citySlug), input.districtSlug);
  } catch {
    // No index (no Sanity, a unit test): the page simply has no figure line.
    return null;
  }
  if (!facts?.medianFlatPricePerSqm || !facts.flatPriceFrom) return null;
  const t = await getTranslations({ locale: input.locale, namespace: "Catalog.depth.answer" });
  const date = new Intl.DateTimeFormat(input.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Tirane" }).format(
    new Date(),
  );
  const shortDate = new Intl.DateTimeFormat(input.locale, { month: "short", year: "numeric", timeZone: "Europe/Tirane" }).format(new Date());
  const sqm = formatMoney(facts.medianFlatPricePerSqm, "EUR", input.locale);
  const from = formatMoney(facts.flatPriceFrom, "EUR", input.locale);
  return {
    line: t("line", { placeIn: input.placeIn, sqm, count: facts.flatCount, date, from }),
    meta: t("meta", { sqm, count: facts.flatCount, date: shortDate }),
  };
}
