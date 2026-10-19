import { routing } from "@/i18n/routing";
import { fetchPartnerPlaceListings } from "@/lib/sanity/queries/partnerLandings";
import { PARTNER_LANDING_MIN_LISTINGS, PARTNER_LANDINGS, partnerLandingPathAfterLocale } from "@/lib/partnerLandings/config";
import { selectPartnerListings } from "@/lib/partnerLandings/facts";
import { buildStaticCodePageEntries, type StaticCodePageEntry } from "./staticCodePages";

/**
 * The partner landings as sitemap entries: one per locale with the full
 * hreflang set, like the other code-only pages, but only for the landings
 * that currently clear their index floor — a page that renders `noindex`
 * does not belong in a sitemap (same rule as the listing families).
 */
export async function buildPartnerLandingSitemapEntries(baseUrl: string): Promise<StaticCodePageEntry[]> {
  const live = await Promise.all(
    PARTNER_LANDINGS.map(async (landing) => {
      try {
        const rows = await fetchPartnerPlaceListings(landing);
        return selectPartnerListings(rows, landing).length >= PARTNER_LANDING_MIN_LISTINGS ? landing : null;
      } catch (err) {
        // A landing the read cannot count is left out rather than listed blind.
        console.warn(`[sitemap] partner landing ${landing.slug} skipped:`, err);
        return null;
      }
    }),
  );
  const pages = live
    .filter((l): l is NonNullable<typeof l> => l !== null)
    .map((l) => ({ path: partnerLandingPathAfterLocale(l), lastModified: l.lastModified }));
  return buildStaticCodePageEntries(baseUrl, routing.locales, pages);
}
