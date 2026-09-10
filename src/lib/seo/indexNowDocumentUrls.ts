import { getClient } from "@/lib/sanity/queries/_core";
import { localizedUrls } from "@/lib/seo/indexNow";
import { resolveLandingPathForSitemap } from "@/lib/sanity/landingSitemapPaths";

/**
 * The public URLs a mutated Sanity document renders, for IndexNow.
 *
 * The revalidation webhook is told a `_type` and an `_id`; turning those into
 * URLs needs one read, because the path is built from slugs the payload does
 * not carry. Only document types that own a page are mapped — editing an
 * `amenity` changes no URL of its own.
 *
 * Every locale of a page is returned: one Sanity document holds all six
 * translations, so a change to it changes all six URLs.
 */
export async function urlsForMutatedDocument(
  type: string,
  id: string | undefined,
): Promise<string[]> {
  const client = getClient();
  if (!client || !id) return [];

  try {
    switch (type) {
      case "property": {
        const slug = await client.fetch<string | null>(
          `*[_id == $id][0].slug.current`,
          { id },
        );
        return slug ? localizedUrls(`property/${encodeURIComponent(slug)}`) : [];
      }

      case "blogPost": {
        const slug = await client.fetch<string | null>(
          `*[_id == $id][0].slug.current`,
          { id },
        );
        // The index lists the post, so it changes too.
        return slug
          ? [...localizedUrls(`blog/${encodeURIComponent(slug)}`), ...localizedUrls("blog")]
          : [];
      }

      case "city": {
        const row = await client.fetch<{ slug?: string; country?: string } | null>(
          `*[_id == $id][0]{ "slug": slug.current, "country": country->slug.current }`,
          { id },
        );
        if (!row?.slug) return [];
        const country = row.country ?? "albania";
        return [
          ...localizedUrls(`${country}/${row.slug}/info`),
          ...localizedUrls(`${country}/${row.slug}/districts`),
          ...localizedUrls("cities"),
        ];
      }

      case "district": {
        const row = await client.fetch<{
          slug?: string;
          citySlug?: string;
          country?: string;
        } | null>(
          `*[_id == $id][0]{
            "slug": slug.current,
            "citySlug": city->slug.current,
            "country": city->country->slug.current
          }`,
          { id },
        );
        if (!row?.slug || !row.citySlug) return [];
        const country = row.country ?? "albania";
        return [
          ...localizedUrls(`${country}/${row.citySlug}/districts/${row.slug}`),
          ...localizedUrls(`${country}/${row.citySlug}/districts`),
        ];
      }

      case "landingPage":
      case "homePage": {
        const row = await client.fetch<Record<string, unknown> | null>(
          `*[_id == $id][0]{
            _id,
            "slug": slug.current,
            _updatedAt,
            pageType,
            seo,
            "linkedCitySlug": linkedCity->slug.current,
            "linkedCityCountrySlug": linkedCity->country->slug.current,
            "linkedDistrictSlug": linkedDistrict->slug.current,
            "linkedDistrictCitySlug": linkedDistrict->city->slug.current,
            "linkedDistrictCountrySlug": linkedDistrict->city->country->slug.current
          }`,
          { id },
        );
        if (!row) return [];

        // District landings are not in `fetchAllLandingPathsForSitemap` — the
        // district sitemap is built from `district` documents instead — so the
        // shared resolver returns null for them and editing one would ping
        // nothing. Their URL comes from the district they are linked to.
        if (row.pageType === "district" && typeof row.linkedDistrictSlug === "string") {
          const citySlug = row.linkedDistrictCitySlug;
          if (typeof citySlug !== "string" || !citySlug) return [];
          const country =
            typeof row.linkedDistrictCountrySlug === "string"
              ? row.linkedDistrictCountrySlug
              : "albania";
          return localizedUrls(
            `${country}/${citySlug}/districts/${row.linkedDistrictSlug}`,
          );
        }

        // The same resolver the sitemaps use, so a landing is announced at the
        // URL it is actually listed under — or not at all, when it is noindex.
        const path = resolveLandingPathForSitemap(row as never);
        return path ? localizedUrls(path) : [];
      }

      case "zoneMetrics": {
        // Figures appear on the zone's own page and on its city's.
        const row = await client.fetch<{
          zoneType?: string;
          zoneSlug?: string;
          citySlug?: string;
          country?: string;
        } | null>(
          `*[_id == $id][0]{
            "zoneType": zone->_type,
            "zoneSlug": zone->slug.current,
            "citySlug": zone->city->slug.current,
            "country": coalesce(zone->city->country->slug.current, zone->country->slug.current)
          }`,
          { id },
        );
        if (!row?.zoneSlug) return [];
        const country = row.country ?? "albania";
        if (row.zoneType === "district" && row.citySlug) {
          return [
            ...localizedUrls(`${country}/${row.citySlug}/districts/${row.zoneSlug}`),
            ...localizedUrls(`${country}/${row.citySlug}/info`),
          ];
        }
        return localizedUrls(`${country}/${row.zoneSlug}/info`);
      }

      default:
        return [];
    }
  } catch {
    // A ping is never worth failing a revalidation over.
    return [];
  }
}
