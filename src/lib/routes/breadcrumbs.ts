import type { BreadcrumbItem } from "@/components/shared/Breadcrumb";
import {
  catalogFilterPath,
  catalogPath,
  cityInfoPath,
  districtsHubPath,
} from "@/lib/routes/catalog";

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

export function buildBlogBreadcrumbItems(args: {
  locale: string;
  homeLabel: string;
  blogLabel: string;
  categorySlug?: string;
  categoryLabel?: string;
  postTitle?: string;
}): BreadcrumbItem[] {
  const { locale, homeLabel, blogLabel, categorySlug, categoryLabel, postTitle } =
    args;
  const items: BreadcrumbItem[] = [
    { label: homeLabel, href: `/${locale}` },
    { label: blogLabel, href: postTitle ? `/${locale}/blog` : undefined },
  ];

  if (categorySlug && categoryLabel) {
    const categoryHref = postTitle
      ? `/${locale}/blog?category=${encodeURIComponent(categorySlug)}`
      : undefined;
    items.push({ label: categoryLabel, href: categoryHref });
  }

  if (postTitle) {
    items.push({ label: postTitle });
  }

  return items;
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

export function buildCitiesBreadcrumbItems(args: {
  locale: string;
  homeLabel: string;
  citiesLabel: string;
}): BreadcrumbItem[] {
  const { locale, homeLabel, citiesLabel } = args;
  return [
    { label: homeLabel, href: `/${locale}` },
    { label: citiesLabel },
  ];
}

export function buildCityLandingBreadcrumbItems(args: {
  locale: string;
  homeLabel: string;
  citiesLabel: string;
  cityLabel: string;
}): BreadcrumbItem[] {
  const { locale, homeLabel, citiesLabel, cityLabel } = args;
  return [
    { label: homeLabel, href: `/${locale}` },
    { label: citiesLabel, href: `/${locale}/cities` },
    { label: cityLabel },
  ];
}

export function buildGuidesBreadcrumbItems(args: {
  locale: string;
  homeLabel: string;
  guidesLabel: string;
  guideTitle: string;
}): BreadcrumbItem[] {
  const { locale, homeLabel, guidesLabel, guideTitle } = args;
  // No guides index route exists, so the "Guides" crumb is unlinked.
  return [
    { label: homeLabel, href: `/${locale}` },
    { label: guidesLabel },
    { label: guideTitle },
  ];
}

export function buildDistrictsBreadcrumbItems(args: {
  locale: string;
  homeLabel: string;
  countryLabel: string;
  countrySlug: string;
  cityLabel: string;
  citySlug: string;
  districtsLabel: string;
  /** When set, "Districts" links to the hub and the district is the current page. */
  districtLabel?: string;
}): BreadcrumbItem[] {
  const {
    locale,
    homeLabel,
    countryLabel,
    countrySlug,
    cityLabel,
    citySlug,
    districtsLabel,
    districtLabel,
  } = args;
  const items: BreadcrumbItem[] = [
    { label: homeLabel, href: `/${locale}` },
    { label: countryLabel, href: `/${locale}/${encodeURIComponent(countrySlug)}` },
    {
      label: cityLabel,
      href: catalogFilterPath({
        locale,
        city: citySlug,
        country: countrySlug,
        trustedCityCountrySlug: countrySlug,
      }),
    },
    {
      label: districtsLabel,
      href: districtLabel ? districtsHubPath(locale, citySlug, countrySlug) : undefined,
    },
  ];
  if (districtLabel) items.push({ label: districtLabel });
  return items;
}

export function buildFavoritesBreadcrumbItems(args: {
  locale: string;
  homeLabel: string;
  favoritesLabel: string;
}): BreadcrumbItem[] {
  const { locale, homeLabel, favoritesLabel } = args;
  return [
    { label: homeLabel, href: `/${locale}` },
    { label: favoritesLabel },
  ];
}

export function buildPropertyDetailBreadcrumbItems(args: {
  locale: string;
  homeLabel: string;
  propertiesLabel: string;
  propertyTitle: string;
  citySlug?: string | null;
  districtSlug?: string | null;
  locations: BreadcrumbLocation[];
  districts: BreadcrumbDistrict[];
}): BreadcrumbItem[] {
  const {
    locale,
    homeLabel,
    propertiesLabel,
    propertyTitle,
    citySlug,
    districtSlug,
    locations,
    districts,
  } = args;

  const items: BreadcrumbItem[] = [
    { label: homeLabel, href: `/${locale}` },
    { label: propertiesLabel, href: catalogPath(locale) },
  ];

  if (citySlug) {
    const city = citySlug.toLowerCase();
    const cityLabel =
      locations.find((l) => l.value.toLowerCase() === city)?.label ||
      formatBreadcrumbSlug(citySlug);
    const trustedCityCountrySlug = locations.find(
      (l) => l.value.toLowerCase() === city
    )?.countrySlug;
    const cityHref = catalogFilterPath({
      locale,
      city: citySlug,
      trustedCityCountrySlug,
    });
    items.push({ label: cityLabel, href: cityHref });
  }

  if (districtSlug && citySlug) {
    const district = districtSlug.toLowerCase();
    const districtLabel =
      districts.find((d) => d.value.toLowerCase() === district)?.label ||
      formatBreadcrumbSlug(districtSlug);
    const trustedCityCountrySlug = locations.find(
      (l) => l.value.toLowerCase() === citySlug.toLowerCase()
    )?.countrySlug;
    items.push({
      label: districtLabel,
      href: catalogFilterPath({
        locale,
        city: citySlug,
        district: districtSlug,
        trustedCityCountrySlug,
      }),
    });
  }

  items.push({ label: propertyTitle });

  return items;
}

export function buildCityLandingCurrentPath(args: {
  locale: string;
  city: string;
  countrySlug?: string;
}): string {
  return cityInfoPath(args.locale, args.city, args.countrySlug);
}
