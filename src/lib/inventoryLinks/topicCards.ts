import { fetchCatalogFilterOptions, fetchCatalogProperties, fetchSeoPageDecisions } from "@/lib/sanity/client";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";
import {
  largestCity,
  pickInventoryCards,
  planInventoryLinks,
  type PlaceDirectory,
  type PlaceTopic,
} from "@/lib/inventoryLinks/places";
import type { PropertyHomes } from "@/types/propertyHomes";

/** Enough rows per source to find the cards with a photo, of the wanted type. */
const SOURCE_PAGE_SIZE = 12;

/**
 * Live sale listings for an article's places, in the order
 * `planInventoryLinks` ranks them (the first city's districts, the city, then
 * the other cities). The same plan the "Property for sale and prices" section
 * under the article uses, so a block near the top and that section can split
 * one pool between them with `exclude`.
 */
export async function loadTopicCards(input: {
  locale: string;
  topics: (dir: PlaceDirectory) => PlaceTopic[];
  count: number;
  exclude?: readonly string[];
  /** Only these property types (slugs); every type when absent. */
  types?: readonly string[];
}): Promise<PropertyHomes[]> {
  const [options, decisions] = await Promise.all([fetchCatalogFilterOptions(input.locale), fetchSeoPageDecisions()]);
  const cities = options.locations.filter((l) => l.countrySlug).map((l) => l.value.toLowerCase());
  const districtCity: Record<string, string> = {};
  for (const d of options.districts) {
    if (d.citySlug) districtCity[d.value.toLowerCase()] = d.citySlug.toLowerCase();
  }
  const cityRows = (decisions ?? []).flatMap((r) =>
    r.decision.key.family === "city" ? [{ city: r.decision.key.city, count: r.count }] : [],
  );
  const plan = planInventoryLinks(input.topics({ cities, districtCity }), { fallbackCity: largestCity(cityRows) });
  const batches = await Promise.all(
    plan.cardSources.map(async (s) => {
      const res = await fetchCatalogProperties({
        city: s.city,
        district: s.district,
        type: s.type,
        deal: "sale",
        page: 1,
        pageSize: SOURCE_PAGE_SIZE,
      });
      const cards = (res?.items ?? []).map((item) => mapCatalogPropertyToCard(item, input.locale));
      return input.types ? cards.filter((c) => input.types!.includes(c.propertyTypeSlug ?? "")) : cards;
    }),
  );
  return pickInventoryCards(batches, { count: input.count, exclude: input.exclude });
}
