/**
 * Click depth of every public listing from its city hub, on live data
 * (audit M-2: every listing within three clicks of the hub).
 *
 * Reads the public Sanity dataset (no token; read-only) and rebuilds the links
 * the catalogue renders, with the same helper the page index uses
 * (`src/lib/catalog/listingPagination.ts`):
 *   - each city page lists 24 cards in the catalogue's default order
 *     (promoted first, then newest), banners kept out of the paged list;
 *   - every page links to every other page of the same listing;
 *   - up to three catalogue banners for the city are linked from every page.
 * District and facet links are left out on purpose: they only add paths, so
 * the depths printed are an upper bound.
 *
 * Listings whose city has no hub (city unpublished or without a country) are
 * reported separately, with their depth from the national hub `/sale`.
 *
 * Run (Node >= 22.6, native type stripping):
 *   node scripts/check-listing-click-depth.ts            # summary
 *   node scripts/check-listing-click-depth.ts --cities   # plus one line per city
 *   node scripts/check-listing-click-depth.ts --strict   # exit 1 when a listing is deeper than 3
 */

import { createClient } from "@sanity/client";
import type * as PaginationModule from "../src/lib/catalog/listingPagination";

// Loaded by URL: Node's type stripping resolves neither `@/` nor extensionless
// paths, and TypeScript refuses a literal `.ts` import without
// `allowImportingTsExtensions`. The type import above keeps it checked.
const pagination = (await import(
  new URL("../src/lib/catalog/listingPagination.ts", import.meta.url).href
)) as typeof PaginationModule;
const { CATALOG_PAGE_SIZE, catalogTotalPages, catalogueClickDepths } = pagination;

const MAX_DEPTH = 3;
const BANNERS_PER_PAGE = 3;
const PUBLIC_DEAL_TYPES = ["sale"]; // src/lib/catalog/publicDealTypes.ts

const argv = process.argv.slice(2);
const perCity = argv.includes("--cities");
const strict = argv.includes("--strict");

// src/lib/sanity/groq/propertyFilters.ts → publishedPropertyFilter()
const PUBLISHED = (prefix = "") =>
  `${prefix}isPublished == true && (${prefix}lifecycleStatus == "active" || !defined(${prefix}lifecycleStatus)) && ${prefix}status in ${JSON.stringify(PUBLIC_DEAL_TYPES)}`;

// src/lib/sanity/queries/catalog.ts → default ("newest") order.
const PROMOTION_ORDER =
  'select(promoted == true => 1, 0) desc, select(promotionType == "premium" => 3, promotionType == "top" => 2, promotionType == "sale" => 1, 0) desc, coalesce(featuredOrder, 999999) asc';

type Row = { _id: string; slug: string | null; city: string | null; district: string | null };
type City = { slug: string; country: string | null };
type Banner = { propertyId: string; city: string | null };

async function main() {
  const client = createClient({ projectId: "g4aqp6ex", dataset: "production", apiVersion: "2024-01-01", useCdn: false });
  const data = await client.fetch<{ cities: City[]; listings: Row[]; banners: Banner[] }>(`{
    "cities": *[_type == "city" && isPublished != false && defined(slug.current)]{
      "slug": slug.current, "country": country->slug.current
    },
    "listings": *[_type == "property" && ${PUBLISHED()}] | order(${PROMOTION_ORDER}, _createdAt desc){
      _id, "slug": slug.current, "city": city->slug.current, "district": district->slug.current
    },
    "banners": coalesce(*[_type == "siteSettings" && _id == "siteSettings"][0].propertySettings.propertyCatalogBanners[
      enabled == true && defined(property->_id) && !(property->_id in path("drafts.**")) &&
      defined(property->slug.current) && ${PUBLISHED("property->")} &&
      defined(imageSmall.asset) && defined(imageBig.asset) && defined(imageSmall.alt) && defined(imageBig.alt)
    ] | order(order asc, _key asc){ "propertyId": property->_id, "city": property->city->slug.current }, [])
  }`);

  // Only listings with a page of their own count: a card links nowhere without a slug.
  const listings = data.listings.filter((l) => l.slug);
  const hubCities = new Map(
    data.cities.filter((c) => c.country).map((c) => [c.slug.toLowerCase(), c] as const),
  );

  /** The banners a catalogue filtered to `city` (or the whole country) shows, deduped, at most three. */
  const bannersFor = (city: string | null): string[] => {
    const out: string[] = [];
    for (const b of data.banners) {
      if (city && b.city !== city) continue;
      if (!out.includes(b.propertyId)) out.push(b.propertyId);
      if (out.length === BANNERS_PER_PAGE) break;
    }
    return out;
  };

  const byCity = new Map<string, Row[]>();
  for (const l of listings) {
    const key = (l.city ?? "").toLowerCase();
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(l);
  }

  const depthOf = new Map<string, number>();
  const cityLines: string[] = [];
  const noHub: Row[] = [];
  for (const [city, rows] of byCity) {
    if (!city || !hubCities.has(city)) {
      noHub.push(...rows);
      continue;
    }
    const pinned = bannersFor(city);
    const paged = rows.map((r) => r._id).filter((id) => !pinned.includes(id));
    const depths = catalogueClickDepths(city, [{ id: city, listingIds: paged, pinnedListingIds: pinned }]);
    let max = 0;
    for (const r of rows) {
      const d = depths.get(r._id) ?? Number.POSITIVE_INFINITY;
      depthOf.set(r._id, d);
      max = Math.max(max, d);
    }
    const country = hubCities.get(city)!.country;
    cityLines.push(
      `  /${country}/${city}: ${rows.length} listings, ${catalogTotalPages(paged.length)} pages, max depth ${max}`,
    );
  }

  // The national hub lists every public listing.
  const salePinned = bannersFor(null);
  const saleDepths = catalogueClickDepths("sale", [
    { id: "sale", listingIds: listings.map((l) => l._id).filter((id) => !salePinned.includes(id)), pinnedListingIds: salePinned },
  ]);

  const hubbed = listings.filter((l) => depthOf.has(l._id));
  const deep = hubbed.filter((l) => depthOf.get(l._id)! > MAX_DEPTH);
  const maxDepth = hubbed.reduce((m, l) => Math.max(m, depthOf.get(l._id)!), 0);
  const histogram = new Map<number, number>();
  for (const l of hubbed) histogram.set(depthOf.get(l._id)!, (histogram.get(depthOf.get(l._id)!) ?? 0) + 1);
  const saleMax = listings.reduce((m, l) => Math.max(m, saleDepths.get(l._id) ?? Number.POSITIVE_INFINITY), 0);

  console.log(`Public listings: ${listings.length} (page size ${CATALOG_PAGE_SIZE})`);
  console.log(`City hubs with listings: ${cityLines.length}`);
  if (perCity) console.log(cityLines.sort().join("\n"));
  console.log(
    `Depth from the city hub: max ${maxDepth}; ` +
      [...histogram.entries()].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d} click${d === 1 ? "" : "s"}: ${n}`).join(", "),
  );
  console.log(`Deeper than ${MAX_DEPTH}: ${deep.length}`);
  for (const l of deep) console.log(`  ${l.slug} (${l.city}) depth ${depthOf.get(l._id)}`);
  console.log(`Depth from /sale: max ${saleMax} (${catalogTotalPages(listings.length - salePinned.length)} pages)`);
  console.log(`Listings with no city hub: ${noHub.length}`);
  for (const l of noHub) console.log(`  ${l.slug} (city: ${l.city ?? "none"}) depth from /sale ${saleDepths.get(l._id)}`);

  if (strict && (deep.length > 0 || noHub.some((l) => (saleDepths.get(l._id) ?? Infinity) > MAX_DEPTH))) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
