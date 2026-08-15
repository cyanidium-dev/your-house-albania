import type { BreadcrumbItem } from "@/components/shared/Breadcrumb";
import {
  agentFilterPath,
  catalogFilterPath,
  catalogPath,
  cityInfoPath,
  districtInfoPath,
  districtsHubPath,
  nonGeoDealListingPath,
  singleFilterPath,
} from "@/lib/routes/catalog";

/**
 * Breadcrumb builders — one per page family.
 * Contract: docs/engineering/SPEC-breadcrumbs-2026-08-15.md
 *
 * A crumb links to the page that contains the current one inside its own
 * family, and a trail never changes family. Two families share URL space and
 * are therefore the two that could be confused:
 *
 *   Catalog  Home → Properties → Country → City → deal → type   (browse listings)
 *   Places   Home → Cities → City → Districts → District         (read about a place)
 *
 * Guides and Blog are self-contained sections; everything else is a flat
 * `Home → Self` page with no parent to walk up to.
 */

export type BreadcrumbLocation = {
  value: string;
  label: string;
  countrySlug?: string;
};
export type BreadcrumbDistrict = { value: string; label: string };

export type BreadcrumbJsonLdItem = { name: string; url?: string };

/** Title-case a URL slug for display ("old-town" -> "Old Town"). */
export function formatBreadcrumbSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Map rendered breadcrumb items to JSON-LD entries. The last item has no href
 * (it is the current page), so it falls back to `currentPath`.
 */
export function toBreadcrumbJsonLdItems(
  items: BreadcrumbItem[],
  currentPath: string
): BreadcrumbJsonLdItem[] {
  return items.map((it, i) => ({
    name: it.label,
    url: it.href ?? (i === items.length - 1 ? currentPath : undefined),
  }));
}

/** Drop the href from the final crumb: the current page never links to itself. */
function closeTrail(items: BreadcrumbItem[]): BreadcrumbItem[] {
  if (items.length === 0) return items;
  const last = items[items.length - 1];
  return [...items.slice(0, -1), { ...last, href: undefined }];
}

// ---------------------------------------------------------------------------
// Catalog spine
// ---------------------------------------------------------------------------

export type CatalogCrumbInput = {
  locale: string;
  labels: { home: string; properties: string; agents: string };
  agent?: { slug: string; name?: string };
  country?: { slug: string; label: string };
  city?: { slug: string; label: string };
  /** A catalog facet rather than a path segment; used by property detail pages. */
  district?: { slug: string; label: string };
  deal?: { slug: string; label: string };
  type?: { slug: string; label: string };
  /** A listing detail page: appended as the final, unlinked crumb. */
  leaf?: string;
};

/**
 * Home → Properties → Country → City → deal → type.
 *
 * One crumb per level, each linking to its own level, so a crumb drops exactly
 * the levels below it. Replaces the old facet-reset pairs ("Cities" then the
 * city, "Deal type" then the deal), which read as a filter widget rather than
 * a trail; the catalog's own filter UI is where single facets get cleared.
 */
export function buildCatalogCrumbs(input: CatalogCrumbInput): BreadcrumbItem[] {
  const { locale, labels, agent, country, city, district, deal, type, leaf } = input;
  const countrySlug = country?.slug;
  const items: BreadcrumbItem[] = [{ label: labels.home, href: `/${locale}` }];

  if (agent) {
    items.push({ label: labels.agents, href: `/${locale}/agent` });
    items.push({
      label: agent.name || formatBreadcrumbSlug(agent.slug),
      href: agentFilterPath({ locale, agentSlug: agent.slug }),
    });
  } else {
    items.push({ label: labels.properties, href: catalogPath(locale) });
  }

  if (country) {
    items.push({
      label: country.label,
      href: agent
        ? agentFilterPath({ locale, agentSlug: agent.slug, country: countrySlug })
        : `/${locale}/${encodeURIComponent(country.slug)}`,
    });
  }

  if (city) {
    items.push({
      label: city.label,
      href: agent
        ? agentFilterPath({ locale, agentSlug: agent.slug, country: countrySlug, city: city.slug })
        : countrySlug
          ? catalogFilterPath({
              locale,
              country: countrySlug,
              city: city.slug,
              trustedCityCountrySlug: countrySlug,
            })
          : singleFilterPath({ locale, city: city.slug }),
    });
  }

  if (district && city) {
    items.push({
      label: district.label,
      href: catalogFilterPath({
        locale,
        country: countrySlug,
        city: city.slug,
        district: district.slug,
        trustedCityCountrySlug: countrySlug,
      }),
    });
  }

  if (deal) {
    items.push({
      label: deal.label,
      href: agent
        ? agentFilterPath({
            locale,
            agentSlug: agent.slug,
            country: countrySlug,
            city: city?.slug,
            dealType: deal.slug,
          })
        : city
          ? catalogFilterPath({
              locale,
              country: countrySlug,
              city: city.slug,
              dealType: deal.slug,
              trustedCityCountrySlug: countrySlug,
            })
          : nonGeoDealListingPath(locale, deal.slug),
    });
  }

  if (type) items.push({ label: type.label });
  if (leaf) items.push({ label: leaf });

  return closeTrail(items);
}

// ---------------------------------------------------------------------------
// Places spine
// ---------------------------------------------------------------------------

export type PlaceCrumbInput = {
  locale: string;
  labels: { home: string; cities: string; districts: string };
  /**
   * `/cities` is a `cityIndex` landing rather than a static route, so the
   * caller says whether it resolves. When it does not, the crumb still shows
   * but does not link — a dead crumb beats a 404.
   */
  citiesIndexAvailable?: boolean;
  city?: { slug: string; label: string; countrySlug: string };
  /** True on the districts hub; implied by `district`. */
  districts?: boolean;
  district?: { slug: string; label: string };
};

/**
 * Home → Cities → City → Districts → District.
 *
 * No country crumb: there is no editorial country page, and `/{country}` is a
 * catalog route, so including it would cross families on every district page.
 * The city crumb points at the city's info page, never at a catalog filter.
 */
export function buildPlaceCrumbs(input: PlaceCrumbInput): BreadcrumbItem[] {
  const { locale, labels, city, districts, district, citiesIndexAvailable = true } = input;
  const items: BreadcrumbItem[] = [
    { label: labels.home, href: `/${locale}` },
    { label: labels.cities, href: citiesIndexAvailable ? `/${locale}/cities` : undefined },
  ];

  if (city) {
    items.push({ label: city.label, href: cityInfoPath(locale, city.slug, city.countrySlug) });
  }

  if (districts || district) {
    items.push({
      label: labels.districts,
      href: city ? districtsHubPath(locale, city.slug, city.countrySlug) : undefined,
    });
  }

  if (district && city) {
    items.push({
      label: district.label,
      href: districtInfoPath(locale, city.slug, district.slug, city.countrySlug),
    });
  }

  return closeTrail(items);
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export type GuideCrumbInput = {
  locale: string;
  labels: { home: string; guides: string };
  /** Reserved for ТЗ-16's cluster hubs; adding one is a caller change. */
  cluster?: { slug: string; label: string };
  guideTitle?: string;
};

/** Home → Guides → [cluster] → guide. */
export function buildGuideCrumbs(input: GuideCrumbInput): BreadcrumbItem[] {
  const { locale, labels, cluster, guideTitle } = input;
  const items: BreadcrumbItem[] = [
    { label: labels.home, href: `/${locale}` },
    { label: labels.guides, href: `/${locale}/guides` },
  ];
  if (cluster) {
    items.push({
      label: cluster.label,
      href: `/${locale}/guides/${encodeURIComponent(cluster.slug)}`,
    });
  }
  if (guideTitle) items.push({ label: guideTitle });
  return closeTrail(items);
}

export type BlogCrumbInput = {
  locale: string;
  labels: { home: string; blog: string };
  categorySlug?: string;
  categoryLabel?: string;
  postTitle?: string;
};

/** Home → Blog → category → post. Same trail as before, moved for consistency. */
export function buildBlogCrumbs(input: BlogCrumbInput): BreadcrumbItem[] {
  const { locale, labels, categorySlug, categoryLabel, postTitle } = input;
  const items: BreadcrumbItem[] = [
    { label: labels.home, href: `/${locale}` },
    { label: labels.blog, href: `/${locale}/blog` },
  ];
  if (categorySlug && categoryLabel) {
    items.push({
      label: categoryLabel,
      href: `/${locale}/blog?category=${encodeURIComponent(categorySlug)}`,
    });
  }
  if (postTitle) items.push({ label: postTitle });
  return closeTrail(items);
}

/**
 * Home → Self, for pages with no parent: contacts, for-realtors,
 * how-to-publish, register, the investment landings. Not a third spine — a
 * spine needs a hub and a hierarchy, and inventing one to justify a middle
 * crumb would fabricate structure the site does not have.
 */
export function buildFlatCrumbs(args: {
  locale: string;
  homeLabel: string;
  label: string;
}): BreadcrumbItem[] {
  return [{ label: args.homeLabel, href: `/${args.locale}` }, { label: args.label }];
}

// ---------------------------------------------------------------------------
// Current-page paths (the JSON-LD tail)
// ---------------------------------------------------------------------------

export function buildCityLandingCurrentPath(args: {
  locale: string;
  city: string;
  countrySlug?: string;
}): string {
  return cityInfoPath(args.locale, args.city, args.countrySlug);
}

export function buildBlogBreadcrumbCurrentPath(args: {
  locale: string;
  postSlug?: string;
  categorySlug?: string;
}): string {
  const { locale, postSlug, categorySlug } = args;
  return postSlug
    ? `/${locale}/blog/${encodeURIComponent(postSlug)}`
    : categorySlug
      ? `/${locale}/blog?category=${encodeURIComponent(categorySlug)}`
      : `/${locale}/blog`;
}
