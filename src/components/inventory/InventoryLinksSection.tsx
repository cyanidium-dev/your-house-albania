import Link from "@/components/shared/Link";
import { getTranslations } from "next-intl/server";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { Section, SectionHeading, balancedGridClass } from "@/components/shared/layout";
import {
  fetchCatalogFilterOptions,
  fetchCatalogProperties,
  fetchSeoPageDecisions,
} from "@/lib/sanity/client";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";
import { catalogFilterPath } from "@/lib/routes/catalog";
import { nonGeoDealListingPath } from "@/lib/routes/catalogPathPrimitives";
import { resolveCityDisplayName } from "@/lib/seo/listingSeoCopy";
import { methodologyPath } from "@/lib/priceIndex/publish";
import {
  INVENTORY_CARD_COUNT,
  largestCity,
  pickInventoryCards,
  planInventoryLinks,
  resolveCatalogTargets,
  type PlaceDirectory,
  type PlaceTopic,
} from "@/lib/inventoryLinks/places";
import { isListingTopicIndexable } from "@/lib/inventoryLinks/indexing";
import { cityInfoHrefIfIndexable } from "@/lib/inventoryLinks/server";
import { cn } from "@/lib/utils";

/** Enough rows per source to find three with a photo. */
const SOURCE_PAGE_SIZE = 6;

type Props = {
  locale: string;
  /** Resolves the article's places once the directory of cities and districts is known. */
  topics: (dir: PlaceDirectory) => PlaceTopic[];
  /** False when the page already shows listing cards (a CMS carousel or embed): links only. */
  showCards?: boolean;
  /** Listings the page already shows. */
  excludeSlugs?: readonly string[];
  className?: string;
};

/**
 * "Property for sale and prices" under an article (blog post or guide): links
 * to the listing pages of the places it is about, to their price index
 * (`/{country}/{city}/info`, or `/methodology` for Albania as a whole), and up
 * to three live listings. The plan is `planInventoryLinks`; every link goes to
 * a page that exists and is indexed in this locale. Renders nothing when there
 * is nothing to show.
 */
export async function InventoryLinksSection({
  locale,
  topics: resolveTopics,
  showCards = true,
  excludeSlugs = [],
  className,
}: Props) {
  const [t, typeLabels, options, decisions] = await Promise.all([
    getTranslations({ locale, namespace: "InventoryLinks" }),
    getTranslations({ locale, namespace: "Seo.listing.types" }),
    fetchCatalogFilterOptions(locale),
    fetchSeoPageDecisions(),
  ]);

  const countryOf = new Map<string, string>();
  for (const l of options.locations) {
    const slug = l.value.toLowerCase();
    if (l.countrySlug) countryOf.set(slug, l.countrySlug);
  }
  const districtCity: Record<string, string> = {};
  for (const d of options.districts) {
    if (d.citySlug) districtCity[d.value.toLowerCase()] = d.citySlug.toLowerCase();
  }
  const dir: PlaceDirectory = { cities: [...countryOf.keys()], districtCity };

  const cityRows = (decisions ?? []).flatMap((r) =>
    r.decision.key.family === "city" ? [{ city: r.decision.key.city, count: r.count }] : []
  );
  const plan = planInventoryLinks(resolveTopics(dir), { fallbackCity: largestCity(cityRows) });

  const isIndexable = (topic: PlaceTopic) => {
    const country = countryOf.get(topic.city);
    return !!country && isListingTopicIndexable(decisions, { ...topic, country }, locale);
  };
  const catalogTargets = resolveCatalogTargets(plan.catalogTopics, isIndexable);

  const citySlugs = [...new Set([...plan.indexCities, ...catalogTargets.map((c) => c.city)])];
  const [cityNames, indexHrefs, batches] = await Promise.all([
    Promise.all(citySlugs.map(async (c) => [c, await resolveCityDisplayName(c, locale)] as const)),
    Promise.all(
      plan.indexCities.map(async (c) => {
        const country = countryOf.get(c);
        return country ? cityInfoHrefIfIndexable(locale, c, country) : null;
      })
    ),
    showCards
      ? Promise.all(
          plan.cardSources.map(async (s) => {
            const res = await fetchCatalogProperties({
              city: s.city,
              district: s.district,
              type: s.type,
              deal: "sale",
              page: 1,
              pageSize: SOURCE_PAGE_SIZE,
            });
            return (res?.items ?? []).map((item) => mapCatalogPropertyToCard(item, locale));
          })
        )
      : Promise.resolve([]),
  ]);
  const cityName = new Map(cityNames);
  const nameOf = (city: string) => cityName.get(city) || city;
  const districtName = (slug: string) =>
    options.districts.find((d) => d.value.toLowerCase() === slug)?.label || slug;

  const listingLinks: { href: string; label: string }[] = catalogTargets.map((topic) => {
    const country = countryOf.get(topic.city) as string;
    const href = catalogFilterPath({
      locale,
      country,
      trustedCityCountrySlug: country,
      city: topic.city,
      district: topic.district,
      // A typed city listing lives under the deal: `/durres/sale/apartment`.
      dealType: topic.type ? "sale" : undefined,
      propertyType: topic.type,
    });
    const label = topic.district
      ? // With its city: "City Center" alone could be any town's.
        t("districtListings", { district: `${districtName(topic.district)}, ${nameOf(topic.city)}` })
      : topic.type
        ? t("typeListings", { type: typeLabels(topic.type), city: nameOf(topic.city) })
        : t("cityListings", { city: nameOf(topic.city) });
    return { href, label };
  });
  if (plan.kind === "national") {
    listingLinks.unshift({ href: nonGeoDealListingPath(locale, "sale"), label: t("nationalListings") });
  }

  const priceLinks: { href: string; label: string }[] =
    plan.kind === "national"
      ? [{ href: methodologyPath(locale), label: t("nationalPrices") }]
      : plan.indexCities.flatMap((city, i) => {
          const href = indexHrefs[i];
          return href ? [{ href, label: t("cityPrices", { city: nameOf(city) }) }] : [];
        });

  const cards = showCards
    ? pickInventoryCards(batches, { count: INVENTORY_CARD_COUNT, exclude: excludeSlugs })
    : [];
  const links = [...listingLinks, ...priceLinks];
  if (links.length === 0 && cards.length === 0) return null;

  return (
    <Section className={className} aria-labelledby="inventory-links-title">
      <SectionHeading id="inventory-links-title" title={t("title")} />
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={brandButtonClass("secondary", undefined, "sm")}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {cards.length > 0 && (
        <div className={cn(balancedGridClass(cards.length), links.length > 0 && "mt-8")}>
          {cards.map((item) => (
            // A lone card lies wide (photo beside the text), not in one of three slots.
            <PropertyCard key={item.slug} item={item} locale={locale} view={cards.length === 1 ? "list" : "large"} />
          ))}
        </div>
      )}
    </Section>
  );
}
