import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { fetchDistrictListingCounts, fetchSeoPageDecisions } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { catalogFilterPath } from "@/lib/routes/catalog";
import type { ListingFacetKind, ListingFacetSlug } from "@/lib/catalog/listingFacets";
import { selectSeoLinks, type SeoPageKey } from "@/lib/seo/pages";

type Props = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  placeLabel: string;
  districtSlug?: string;
  /** The facet this page is, so its chip reads as the current one. */
  currentFacet?: ListingFacetSlug | "";
};

type Chip = { href: string; label: string; count: number; current: boolean };

const GROUPS: ListingFacetKind[] = ["sea", "rooms", "budget", "stage"];

/**
 * The slices of a place as links: its districts (on a city page), then rooms,
 * budgets and new builds, each with its live count. Only pages the SEO page
 * registry indexes in this locale are linked (`selectSeoLinks`, ADR 004), so
 * every chip leads to a page Google may index and none spends anchor text on a
 * noindexed slice. Server-rendered: these are the links that give district and
 * facet listings their internal weight.
 */
export async function ListingFacetNav({ locale, countrySlug, citySlug, placeLabel, districtSlug, currentFacet = "" }: Props) {
  const [t, districtCounts, decisions] = await Promise.all([
    getTranslations({ locale, namespace: "Catalog.facetNav" }),
    districtSlug ? Promise.resolve([]) : fetchDistrictListingCounts(citySlug),
    fetchSeoPageDecisions(),
  ]);

  const from: SeoPageKey = currentFacet
    ? { family: "facet", country: countrySlug, city: citySlug, district: districtSlug, facet: currentFacet }
    : districtSlug
      ? { family: "district", country: countrySlug, city: citySlug, district: districtSlug }
      : { family: "city", country: countrySlug, city: citySlug };
  const links = selectSeoLinks({
    from,
    locale,
    candidates: (decisions ?? []).map((row) => ({ decision: row.decision, count: row.count })),
  });

  const districtChips: Chip[] = links.flatMap((link) => {
    if (link.group !== "districts" || link.key.family !== "district") return [];
    const slug = link.key.district;
    const title = districtCounts.find((d) => d.slug === slug)?.title;
    return [
      {
        href: catalogFilterPath({ locale, country: countrySlug, trustedCityCountrySlug: countrySlug, city: citySlug, district: slug }),
        label: (title ? resolveLocalizedString(title as never, locale) : "") || slug,
        count: link.count,
        current: false,
      },
    ];
  });

  const facetChips = (kind: ListingFacetKind): Chip[] =>
    links.flatMap((link) => {
      if (link.group !== kind || link.key.family !== "facet") return [];
      const facet = link.key.facet;
      return [
        {
          href: catalogFilterPath({
            locale,
            country: countrySlug,
            trustedCityCountrySlug: countrySlug,
            city: citySlug,
            district: districtSlug,
            facet,
          }),
          label: t(`chip.${facet}`),
          count: link.count,
          current: link.current,
        },
      ];
    });

  const rows: Array<{ key: string; heading: string; chips: Chip[] }> = [
    { key: "districts", heading: t("districts"), chips: districtChips },
    ...GROUPS.map((kind) => ({ key: kind, heading: t(kind), chips: facetChips(kind) })),
  ].filter((row) => row.chips.length > 0);

  if (rows.length === 0) return null;

  return (
    <nav aria-label={t("label", { place: placeLabel })} className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-6 pb-2">
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-dark/50 dark:text-white/50 min-w-20">
              {row.heading}
            </dt>
            <dd className="flex flex-wrap gap-2">
              {row.chips.map((chip) =>
                chip.current ? (
                  <span
                    key={chip.href}
                    aria-current="page"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white"
                  >
                    {chip.label}
                    <span className="text-white/80 tabular-nums">{chip.count}</span>
                  </span>
                ) : (
                  <Link
                    key={chip.href}
                    href={chip.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dark/10 dark:border-white/20 px-3 py-1.5 text-sm font-medium text-dark dark:text-white hover:border-primary hover:text-primary transition-colors"
                  >
                    {chip.label}
                    <span className="text-dark/50 dark:text-white/50 tabular-nums">{chip.count}</span>
                  </Link>
                ),
              )}
            </dd>
          </div>
        ))}
      </dl>
    </nav>
  );
}
