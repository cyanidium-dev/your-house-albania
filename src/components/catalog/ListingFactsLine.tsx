import { getTranslations } from "next-intl/server";
import { fetchCatalogListingStats } from "@/lib/sanity/client";
import type { CatalogFilters } from "@/types/catalog";

type Props = {
  locale: string;
  /** Exactly the filters of the page the line sits on. */
  filters: CatalogFilters;
};

const APARTMENT_TYPES = ["apartment", "studio"];

/**
 * One line of numbers under a listing's H1: how many listings, the lowest total
 * price, and the median price per m² of the flats among them. The pages that
 * rank for these queries lead with a count; none of them says what a square
 * metre costs. Both numbers come from the same filters as the grid, so the
 * line never promises what the page does not show.
 */
export async function ListingFactsLine({ locale, filters }: Props) {
  const flatsOnly = filters.type || filters.types?.length ? filters : { ...filters, types: APARTMENT_TYPES };
  const [t, all, flats] = await Promise.all([
    getTranslations({ locale, namespace: "Catalog.facts" }),
    fetchCatalogListingStats(filters),
    fetchCatalogListingStats(flatsOnly),
  ]);
  if (!all || all.count === 0) return null;

  const money = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const parts = [t("count", { count: all.count })];
  if (all.priceFrom) parts.push(t("from", { price: money(all.priceFrom) }));
  if (flats?.medianPricePerSqm && (flats.count ?? 0) >= 5) {
    parts.push(t("medianPerSqm", { price: money(flats.medianPricePerSqm) }));
  }

  return <p className="text-sm md:text-base font-medium text-white/90 tabular-nums">{parts.join(" · ")}</p>;
}
