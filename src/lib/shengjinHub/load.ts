import { fetchPriceIndexSnapshot } from "@/lib/sanity/queries/priceIndex";
import { fetchSeoPageDecisions, fetchSiteSettings } from "@/lib/sanity/client";
import {
  fetchShengjinCards,
  fetchShengjinFlats,
  fetchShengjinGuides,
  type ShengjinGuide,
  type ShengjinHubListing,
} from "@/lib/sanity/queries/shengjinHub";
import type { SeoPageDecisionRow } from "@/lib/sanity/queries/seoPages";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { PriceIndexCity, PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { SHENGJIN_CITY, SHENGJIN_COMPARE_CITIES } from "./config";
import {
  budgetBands,
  compareRows,
  isBySea,
  layoutRows,
  selectShengjinSeaListings,
  type BudgetBand,
  type CompareRow,
  type LayoutRow,
  type ShengjinFlatRow,
} from "./facts";

export type ShengjinHubData = {
  snapshot: PriceIndexSnapshot | null;
  /** Shëngjin's row of the index, when the city has a listing. */
  city: PriceIndexCity | null;
  /** The comparison table, Shëngjin first. */
  compare: CompareRow[];
  /** Every live flat, one light row each. */
  flats: ShengjinFlatRow[];
  /** Flats by the sea among them. */
  seaCount: number;
  budget: BudgetBand[];
  layouts: LayoutRow[];
  /** The cards to show, ranked. */
  seaListings: ShengjinHubListing[];
  guides: ShengjinGuide[];
  decisions: SeoPageDecisionRow[] | null;
  siteSettings: unknown;
  baseUrl: string;
};

/**
 * Everything the hub page and its metadata need, in one place: the cached
 * reads and the pure facts. The sea listings are ranked over a light read of
 * every flat, then the cards of the chosen dozen are read by id.
 */
export async function loadShengjinHub(): Promise<ShengjinHubData> {
  const [snapshot, flats, guides, decisions, siteSettings, baseUrl] = await Promise.all([
    fetchPriceIndexSnapshot(),
    fetchShengjinFlats(),
    fetchShengjinGuides(),
    fetchSeoPageDecisions(),
    fetchSiteSettings(),
    getBaseUrl(),
  ]);
  const city = snapshot?.cities.find((c) => c.slug === SHENGJIN_CITY && c.listings > 0) ?? null;
  const compare = snapshot ? compareRows(snapshot, SHENGJIN_COMPARE_CITIES) : [];
  const picked = selectShengjinSeaListings(flats);
  const seaListings = await fetchShengjinCards(picked.map((p) => p._id));
  return {
    snapshot,
    city,
    compare,
    flats,
    seaCount: flats.filter((r) => isBySea(r)).length,
    budget: budgetBands(flats),
    layouts: layoutRows(flats),
    seaListings,
    guides,
    decisions: decisions ?? null,
    siteSettings,
    baseUrl,
  };
}
