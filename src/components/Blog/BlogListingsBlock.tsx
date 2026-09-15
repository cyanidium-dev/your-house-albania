import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PropertyCard from "@/components/shared/property/PropertyCard";
import {
  fetchCatalogFilterOptions,
  fetchCatalogProperties,
  fetchCityCountrySlugByCitySlug,
} from "@/lib/sanity/client";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";
import { catalogFilterPath, nonGeoDealListingPath } from "@/lib/routes/catalog";
import { listingTopicsForBlogPost, type BlogListingTopic } from "@/lib/blog/postListingTopics";
import type { PropertyHomes } from "@/types/propertyHomes";

type Props = {
  locale: string;
  postSlug: string;
};

type PlaceLink = { href: string; place: string; count: number };

const CARD_COUNT = 2;

/**
 * "Properties on this topic": links from a blog post to the listings it is
 * about, plus a couple of those listings as cards. Each link goes to the
 * canonical listing URL (city, district or city + type) and carries the live
 * count, so the anchor names the place and says what is behind it.
 *
 * Topics come from `BLOG_POST_LISTING_TOPICS`. A topic with no listings is
 * skipped rather than linked to an empty page; a post with no topic, or none
 * left, links to the national sale listing instead.
 */
export async function BlogListingsBlock({ locale, postSlug }: Props) {
  const [t, options] = await Promise.all([
    getTranslations({ locale, namespace: "Shared.blog" }),
    fetchCatalogFilterOptions(locale),
  ]);

  const typeLabels = await getTranslations({ locale, namespace: "Seo.listing.types" });
  const cityLabel = (slug: string) =>
    options.locations.find((l) => l.value.toLowerCase() === slug)?.label || slug;
  const districtLabel = (slug: string) =>
    options.districts.find((d) => d.value.toLowerCase() === slug)?.label || slug;

  const placeFor = (topic: BlogListingTopic) => {
    const city = cityLabel(topic.city);
    if (topic.district) return `${districtLabel(topic.district)}, ${city}`;
    if (topic.type) return `${typeLabels(topic.type)}, ${city}`;
    return city;
  };

  const resolved = await Promise.all(
    listingTopicsForBlogPost(postSlug).map(async (topic) => {
      const [country, listing] = await Promise.all([
        fetchCityCountrySlugByCitySlug(topic.city),
        fetchCatalogProperties({
          city: topic.city,
          district: topic.district,
          type: topic.type,
          page: 1,
          pageSize: CARD_COUNT,
        }),
      ]);
      const count = listing?.totalCount ?? 0;
      if (!country || count === 0) return null;
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
      return { link: { href, place: placeFor(topic), count }, items: listing?.items ?? [] };
    })
  );
  const topics = resolved.filter((r): r is NonNullable<typeof r> => r !== null);

  let links: PlaceLink[] = topics.map((r) => r.link);
  // Cards come from the topic with the most listings: a post about Tirana,
  // Durrës and Vlorë should show from Durrës's 358, not from Tirana's 4.
  const richest = topics.reduce<(typeof topics)[number] | null>(
    (best, r) => (!best || r.link.count > best.link.count ? r : best),
    null
  );
  let cardSource = richest?.items ?? [];
  let nationalHref: string | null = null;

  if (topics.length === 0) {
    const national = await fetchCatalogProperties({ page: 1, pageSize: CARD_COUNT });
    if (!national || national.totalCount === 0) return null;
    nationalHref = nonGeoDealListingPath(locale, "sale");
    links = [];
    cardSource = national.items ?? [];
  }

  const cards: PropertyHomes[] = cardSource.map((item) => mapCatalogPropertyToCard(item, locale));

  return (
    <section className="mt-12 border-t border-dark/10 dark:border-white/10 pt-10" aria-labelledby="blog-listings-title">
      <h2 id="blog-listings-title" className="text-dark dark:text-white text-2xl font-semibold">
        {t("listingsTitle")}
      </h2>
      <ul className="mt-5 flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center rounded-full border border-dark/10 dark:border-white/20 px-4 py-2 text-sm font-medium text-dark dark:text-white hover:border-primary hover:text-primary transition-colors"
            >
              {t("listingsPlaceLink", { place: link.place, count: link.count })}
            </Link>
          </li>
        ))}
        {nationalHref && (
          <li>
            <Link
              href={nationalHref}
              className="inline-flex items-center rounded-full border border-dark/10 dark:border-white/20 px-4 py-2 text-sm font-medium text-dark dark:text-white hover:border-primary hover:text-primary transition-colors"
            >
              {t("listingsAllAlbania")}
            </Link>
          </li>
        )}
      </ul>
      {cards.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((item) => (
            <PropertyCard key={item.slug} item={item} locale={locale} view="large" />
          ))}
        </div>
      )}
    </section>
  );
}
