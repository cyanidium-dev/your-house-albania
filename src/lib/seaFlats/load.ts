import { fetchSiteSettings } from "@/lib/sanity/client";
import { fetchPriceIndexSnapshot } from "@/lib/sanity/queries/priceIndex";
import { fetchGermanHubSeaCards, type GermanHubSeaListing } from "@/lib/sanity/queries/germanHub";
import { fetchSeaFlats } from "@/lib/sanity/queries/seaFlats";
import { cityMedianMap, hubCityRows, selectSeaListings } from "@/lib/germanHub/facts";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { SEA_FLATS_CARDS, SEA_FLATS_PER_CITY } from "./config";
import { cheapestSeaCity, seaFlatCityRows, seaFlatFigures, type SeaFlatCityRow, type SeaFlatFigures } from "./facts";

export type SeaFlatsData = {
  figures: SeaFlatFigures;
  totalFlats: number;
  cities: SeaFlatCityRow[];
  cheapestCity: SeaFlatCityRow | null;
  /** The cards to show, ranked against their city's median, at most four per city. */
  cards: GermanHubSeaListing[];
  /** Moment the Price Index was last computed, for the date line. */
  computedAt: string | null;
  siteSettings: unknown;
  baseUrl: string;
};

/** Everything the page and its metadata need: the cached reads and the pure facts. */
export async function loadSeaFlats(): Promise<SeaFlatsData> {
  const [{ sea, totalFlats }, snapshot, siteSettings, baseUrl] = await Promise.all([
    fetchSeaFlats(),
    fetchPriceIndexSnapshot(),
    fetchSiteSettings(),
    getBaseUrl(),
  ]);
  const cities = seaFlatCityRows(sea);
  const medians = snapshot ? cityMedianMap(hubCityRows(snapshot, [])) : new Map<string, number>();
  const picked = selectSeaListings(sea, medians, SEA_FLATS_CARDS, SEA_FLATS_PER_CITY);
  const cards = await fetchGermanHubSeaCards(picked.map((p) => p._id));
  return {
    figures: seaFlatFigures(sea),
    totalFlats,
    cities,
    cheapestCity: cheapestSeaCity(cities),
    cards,
    computedAt: snapshot?.computedAt ?? null,
    siteSettings,
    baseUrl,
  };
}
