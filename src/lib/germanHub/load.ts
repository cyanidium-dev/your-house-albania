import { fetchPriceIndexSnapshot } from "@/lib/sanity/queries/priceIndex";
import {
  fetchGermanHubGuides,
  fetchGermanHubSeaCandidates,
  fetchGermanHubSeaCards,
  type GermanHubGuide,
  type GermanHubSeaListing,
} from "@/lib/sanity/queries/germanHub";
import { fetchSiteSettings } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { GERMAN_HUB_LEAD_CITIES } from "./config";
import { cityMedianMap, hubCityRows, hubLeadCities, selectSeaListings, type HubCityRow } from "./facts";

export type GermanHubData = {
  snapshot: PriceIndexSnapshot | null;
  /** Every city with a listing: the lead cities first. */
  cityRows: HubCityRow[];
  /** The lead cities with a median to print, in lead order. */
  leadCities: HubCityRow[];
  /** The flats by the sea to show, ranked. */
  seaListings: GermanHubSeaListing[];
  guides: GermanHubGuide[];
  siteSettings: unknown;
  baseUrl: string;
};

/**
 * Everything the hub page and its metadata need, in one place: the cached
 * reads and the pure facts. The sea listings are ranked over a light read of
 * every candidate, then the cards of the chosen dozen are read by id.
 */
export async function loadGermanHub(): Promise<GermanHubData> {
  const [snapshot, candidates, guides, siteSettings, baseUrl] = await Promise.all([
    fetchPriceIndexSnapshot(),
    fetchGermanHubSeaCandidates(),
    fetchGermanHubGuides(),
    fetchSiteSettings(),
    getBaseUrl(),
  ]);
  const cityRows = snapshot ? hubCityRows(snapshot, GERMAN_HUB_LEAD_CITIES) : [];
  const leadCities = hubLeadCities(cityRows, GERMAN_HUB_LEAD_CITIES);
  const picked = selectSeaListings(candidates, cityMedianMap(cityRows));
  const seaListings = await fetchGermanHubSeaCards(picked.map((p) => p._id));
  return { snapshot, cityRows, leadCities, seaListings, guides, siteSettings, baseUrl };
}
