import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions, fetchCityCountrySlugByCitySlug } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  dealRouteSegmentToQueryValue,
  normalizeCatalogCountrySlug,
} from "@/lib/routes/catalog";
import { buildListingUrl } from "@/lib/routes/listingRoutes";
import { buildCatalogCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";

type CatalogBreadcrumbProps = {
  locale: string;
  agentSlug?: string;
  agentName?: string;
  country?: string;
  city?: string;
  dealType?: string;
  propertyType?: string;
};

export async function CatalogBreadcrumb({
  locale,
  agentSlug,
  agentName,
  country,
  city,
  dealType,
  propertyType,
}: CatalogBreadcrumbProps) {
  const [t, options] = await Promise.all([
    getTranslations("Breadcrumbs"),
    fetchCatalogFilterOptions(locale),
  ]);
  const locations = options.locations;

  let countryForPath = country;
  if (city && typeof country === "string" && country.trim()) {
    const fromLoc = locations.find((l) => l.value.toLowerCase() === city.toLowerCase())?.countrySlug;
    const derived = fromLoc ?? (await fetchCityCountrySlugByCitySlug(city));
    if (derived) countryForPath = derived;
  }
  const countrySeg = countryForPath ? normalizeCatalogCountrySlug(countryForPath) : undefined;
  const dealsT = await getTranslations("Catalog.filters");
  const propertyTypes = options.propertyTypes;

  const dealLabel = (slug: string) =>
    slug === "sale"
      ? dealsT("dealSale")
      : slug === "rent"
        ? dealsT("dealRent")
        : slug === "short-term-rent"
          ? dealsT("dealShortTerm")
          : formatSlug(slug);

  // Catalog spine: one crumb per level, each linking to its own level.
  const items = buildCatalogCrumbs({
    locale,
    labels: {home: t("home"), properties: t("catalog"), agents: t("agents")},
    agent: agentSlug ? {slug: agentSlug, name: agentName} : undefined,
    country: countrySeg ? {slug: countrySeg, label: formatSlug(countrySeg)} : undefined,
    city: city
      ? {
          slug: city,
          label:
            locations.find((l) => l.value.toLowerCase() === city.toLowerCase())?.label ||
            formatSlug(city),
        }
      : undefined,
    deal: dealType ? {slug: dealType, label: dealLabel(dealType)} : undefined,
    type: propertyType
      ? {
          slug: propertyType,
          label:
            propertyTypes.find((p) => p.value.toLowerCase() === propertyType.toLowerCase())
              ?.label || formatSlug(propertyType),
        }
      : undefined,
  });

  const baseUrl = await getBaseUrl();
  const currentPath = buildCurrentPath({
    locale,
    agentSlug,
    country: countryForPath,
    city,
    dealType,
    propertyType,
  });
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} />
    </>
  );
}

function formatSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCurrentPath({
  locale,
  agentSlug,
  country,
  city,
  dealType,
  propertyType,
}: {
  locale: string;
  agentSlug?: string;
  country?: string;
  city?: string;
  dealType?: string;
  propertyType?: string;
}): string {
  const cSeg = country ? normalizeCatalogCountrySlug(country) : undefined;
  const dealQuery = dealType ? dealRouteSegmentToQueryValue(String(dealType)) : undefined;
  if (agentSlug) {
    return buildListingUrl({
      scope: "agent",
      locale,
      agentSlug,
      country: cSeg,
      city,
      dealQuery,
      propertyType,
    });
  }
  if (city || dealType || propertyType) {
    if (country && !city && !dealType && !propertyType) {
      return `/${locale}/${encodeURIComponent(cSeg!)}`;
    }
    if (country && city) {
      return buildListingUrl({
        scope: "catalog",
        locale,
        country: cSeg,
        city,
        dealQuery,
        propertyType,
      });
    }
    if (!country && !city && dealType && propertyType) {
      return buildListingUrl({
        scope: "catalog",
        locale,
        dealQuery,
        propertyType,
      });
    }
    return buildListingUrl({
      scope: "catalog",
      locale,
      city,
      dealQuery,
      propertyType,
    });
  }
  return buildListingUrl({ scope: "catalog", locale });
}
