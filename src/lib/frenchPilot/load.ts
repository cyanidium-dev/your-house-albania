import { fetchPriceIndexSnapshot } from "@/lib/sanity/queries/priceIndex";
import { fetchFrenchPilotListings, type FrenchPilotListing } from "@/lib/sanity/queries/frenchPilot";
import { fetchSiteSettings } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { hubCityRows, hubLeadCities, listingPricePerSqm, type HubCityRow } from "@/lib/germanHub/facts";
import type { PriceIndexDistrict, PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { MIN_STAT_LISTINGS } from "@/lib/catalog/listingDepth";
import { FRENCH_PILOT_CITY, FRENCH_PILOT_DISTRICTS } from "./config";

/** The cities the hub's hero names, in this order: the four coastal and capital markets. */
export const FRENCH_HUB_LEAD_CITIES: readonly string[] = ["durres", "tirana", "vlore", "sarande"];

/** A listing within this many metres of the sea, or on the first line, counts as "by the sea". */
export const FRENCH_SEA_MAX_METERS = 500;

export type FrenchDistrictRow = PriceIndexDistrict & { pilot: boolean };

export type FrenchPilotData = {
  snapshot: PriceIndexSnapshot | null;
  /** Every city with a listing: the lead cities first. */
  cityRows: HubCityRow[];
  /** The lead cities with a median to print, in lead order. */
  leadCities: HubCityRow[];
  /** Durrës districts with a median, the pilot's five first. */
  durresDistricts: FrenchDistrictRow[];
  /** The pilot listings, cheapest per m² against their district median first. */
  listings: FrenchPilotListing[];
  siteSettings: unknown;
  baseUrl: string;
};

/** Asking €/m² over the district median, `null` when either is missing. */
function ratioToDistrict(row: FrenchPilotListing, medians: ReadonlyMap<string, number>): number | null {
  const perSqm = listingPricePerSqm(row);
  const median = row.districtSlug ? medians.get(row.districtSlug) : undefined;
  return perSqm !== null && typeof median === "number" && median > 0 ? perSqm / median : null;
}

/** Everything the French hub and guides print: the live index and the pilot listings. */
export async function loadFrenchPilot(): Promise<FrenchPilotData> {
  const [snapshot, rows, siteSettings, baseUrl] = await Promise.all([
    fetchPriceIndexSnapshot(),
    fetchFrenchPilotListings(),
    fetchSiteSettings(),
    getBaseUrl(),
  ]);
  const cityRows = snapshot ? hubCityRows(snapshot, FRENCH_HUB_LEAD_CITIES) : [];
  const leadCities = hubLeadCities(cityRows, FRENCH_HUB_LEAD_CITIES);

  const durres = snapshot?.cities.find((c) => c.slug === FRENCH_PILOT_CITY);
  const durresDistricts: FrenchDistrictRow[] = (durres?.districts ?? [])
    .filter((d) => d.count >= MIN_STAT_LISTINGS && d.median !== null)
    .map((d) => ({ ...d, pilot: FRENCH_PILOT_DISTRICTS.includes(d.slug) }))
    .sort((a, b) => Number(b.pilot) - Number(a.pilot) || b.count - a.count);

  const medians = new Map(durresDistricts.map((d) => [d.slug, d.median as number]));
  const listings = [...rows].sort((a, b) => {
    const ra = ratioToDistrict(a, medians);
    const rb = ratioToDistrict(b, medians);
    if (ra !== null && rb !== null) return ra - rb;
    return ra === null ? 1 : -1;
  });

  return { snapshot, cityRows, leadCities, durresDistricts, listings, siteSettings, baseUrl };
}

/** The pilot listings by the sea: stated distance within `FRENCH_SEA_MAX_METERS`, or the first line. */
export function frenchSeaListings(listings: readonly FrenchPilotListing[]): FrenchPilotListing[] {
  return listings.filter(
    (l) =>
      l.beachfront === true ||
      (typeof l.seaDistanceMeters === "number" && l.seaDistanceMeters > 0 && l.seaDistanceMeters <= FRENCH_SEA_MAX_METERS),
  );
}
