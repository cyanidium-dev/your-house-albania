import "server-only";

import { fetchCatalogFilterOptions, fetchCityListingPriceIndex, fetchDistrictBySlugs } from "@/lib/sanity/client";
import { fetchPartnerPlaceListings, type PartnerLandingListing } from "@/lib/sanity/queries/partnerLandings";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { placePriceFacts } from "@/lib/catalog/listingDepth";
import { findPartnerLanding, type PartnerLanding } from "./config";
import {
  orderForGrid,
  pickHeroListing,
  selectPartnerListings,
  summarizePartnerSelection,
  type PartnerSelectionFacts,
} from "./facts";

export type PartnerLandingData = {
  landing: PartnerLanding;
  /** The selection the page is about. */
  rows: PartnerLandingListing[];
  facts: PartnerSelectionFacts;
  /** The place's median asking price per m² from the price index, `null` below the sample floor. */
  placeMedianPricePerSqm: number | null;
  /** Cards, in page order. */
  grid: PartnerLandingListing[];
  hero: PartnerLandingListing | null;
  names: {
    /** "Plazh" / "Tocak, Plazh" / "Shëngjin": the page's subject. */
    place: string;
    /** "Plazh, Durrës": the subject with its city, for titles and descriptions. */
    placeFull: string;
    city: string;
    district: string | null;
  };
  /** The district's CMS card text, when it has one; the page's "why here" block. */
  placeText: string | null;
};

/** Everything a partner landing renders, or `null` when the slug is not one. */
export async function loadPartnerLanding(locale: string, slug: string): Promise<PartnerLandingData | null> {
  const landing = findPartnerLanding(slug);
  if (!landing) return null;
  const { city, district } = landing.place;
  const [all, priceIndex, options, districtDoc] = await Promise.all([
    fetchPartnerPlaceListings(landing),
    fetchCityListingPriceIndex(city),
    fetchCatalogFilterOptions(locale),
    district ? fetchDistrictBySlugs(city, district) : Promise.resolve(null),
  ]);
  const rows = selectPartnerListings(all, landing);
  const facts = summarizePartnerSelection(rows, landing);
  const placeMedianPricePerSqm = placePriceFacts(priceIndex, district)?.medianFlatPricePerSqm ?? null;

  const cityLabel = options.locations.find((l) => l.value.toLowerCase() === city)?.label || titleCase(city);
  const districtLabel = district
    ? options.districts.find((d) => d.value.toLowerCase() === district)?.label || titleCase(district)
    : null;
  const placeOnly = districtLabel ?? cityLabel;
  const place = landing.complex ? `${landing.complex.name}, ${placeOnly}` : placeOnly;
  const placeFull = districtLabel ? `${place}, ${cityLabel}` : place;

  const placeText = districtDoc?.shortDescription
    ? resolveLocalizedString(districtDoc.shortDescription as never, locale) || null
    : null;

  return {
    landing,
    rows,
    facts,
    placeMedianPricePerSqm,
    grid: orderForGrid(rows),
    hero: pickHeroListing(rows),
    names: { place, placeFull, city: cityLabel, district: districtLabel },
    placeText,
  };
}

function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
