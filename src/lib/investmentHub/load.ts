import { fetchSiteSettings } from "@/lib/sanity/client";
import { fetchPriceIndexSnapshot } from "@/lib/sanity/queries/priceIndex";
import { fetchGermanHubSeaCandidates, fetchGermanHubSeaCards, type GermanHubSeaListing } from "@/lib/sanity/queries/germanHub";
import { cityMedianMap, hubCityRows, listingPricePerSqm, selectSeaListings } from "@/lib/germanHub/facts";
import { fetchInvestmentHubContent, type InvestmentHubArticle, type InvestmentHubGuide } from "@/lib/sanity/queries/investmentHub";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { INVESTMENT_HUB_CARDS, INVESTMENT_HUB_LEAD_CITIES, INVESTMENT_HUB_MAX_PRICE, INVESTMENT_HUB_PER_CITY } from "./config";
import { bestYieldCity, cheapestReliableCity, investmentCityRows, type InvestmentCityRow } from "./facts";

export type InvestmentHubData = {
  snapshot: PriceIndexSnapshot | null;
  cities: InvestmentCityRow[];
  bestYield: InvestmentCityRow | null;
  cheapest: InvestmentCityRow | null;
  /** Off-plan and under-construction sale listings, nationwide. */
  newBuilds: number;
  /** Flats by the sea up to the price cap, best €/m² against their city first, at most four per city. */
  cards: GermanHubSeaListing[];
  /** How many flats by the sea sit under the cap. */
  underCap: number;
  articles: InvestmentHubArticle[];
  guide: InvestmentHubGuide | null;
  siteSettings: unknown;
  baseUrl: string;
};

/** Everything the hub page and its metadata need: the cached reads and the pure facts. */
export async function loadInvestmentHub(): Promise<InvestmentHubData> {
  const [snapshot, candidates, content, siteSettings, baseUrl] = await Promise.all([
    fetchPriceIndexSnapshot(),
    fetchGermanHubSeaCandidates(),
    fetchInvestmentHubContent(),
    fetchSiteSettings(),
    getBaseUrl(),
  ]);
  const cities = snapshot ? investmentCityRows(snapshot, INVESTMENT_HUB_LEAD_CITIES) : [];
  const medians = snapshot ? cityMedianMap(hubCityRows(snapshot, [])) : new Map<string, number>();
  const affordable = candidates.filter(
    (c) => c.priceUnit !== "per-sqm" && typeof c.price === "number" && c.price <= INVESTMENT_HUB_MAX_PRICE && listingPricePerSqm(c) !== null,
  );
  const picked = selectSeaListings(affordable, medians, INVESTMENT_HUB_CARDS, INVESTMENT_HUB_PER_CITY);
  const cards = await fetchGermanHubSeaCards(picked.map((p) => p._id));
  return {
    snapshot,
    cities,
    bestYield: bestYieldCity(cities),
    cheapest: cheapestReliableCity(cities),
    newBuilds: snapshot ? snapshot.cities.reduce((n, c) => n + c.newBuild.listings, 0) : 0,
    cards,
    underCap: affordable.length,
    articles: content.articles,
    guide: content.guide,
    siteSettings,
    baseUrl,
  };
}
