import { fetchSiteSettings } from "@/lib/sanity/client";
import { fetchHouseCards, fetchHouses, type SeaHouseListing } from "@/lib/sanity/queries/seaHouses";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { districtHouseRows, seaHouseFigures, selectSeaHouses, type DistrictHouseRow, type HouseRow, type SeaHouseFigures } from "./facts";

export type SeaHousesData = {
  houses: HouseRow[];
  figures: SeaHouseFigures;
  districts: DistrictHouseRow[];
  /** The cards to show, cheapest first. */
  cards: SeaHouseListing[];
  /** When every house by the sea is in one city, its slug (the hero photo and the copy name it). */
  singleCity: string | null;
  siteSettings: unknown;
  baseUrl: string;
};

/** Everything the page and its metadata need: the cached reads and the pure facts. */
export async function loadSeaHouses(): Promise<SeaHousesData> {
  const [houses, siteSettings, baseUrl] = await Promise.all([fetchHouses(), fetchSiteSettings(), getBaseUrl()]);
  const figures = seaHouseFigures(houses);
  const districts = districtHouseRows(houses);
  const picked = selectSeaHouses(houses);
  const cards = await fetchHouseCards(picked.map((p) => p._id));
  const cities = new Set(districts.map((d) => d.citySlug));
  return {
    houses,
    figures,
    districts,
    cards,
    singleCity: cities.size === 1 ? [...cities][0] : null,
    siteSettings,
    baseUrl,
  };
}
