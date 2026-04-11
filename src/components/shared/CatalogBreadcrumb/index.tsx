import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  agentFilterPath,
  catalogFilterPath,
  catalogPath,
  dealRouteSegmentToQueryValue,
  nonGeoDealListingPath,
  normalizeCatalogCountrySlug,
  singleFilterPath,
} from "@/lib/routes/catalog";
import { buildListingUrl } from "@/lib/routes/listingRoutes";
import type { BreadcrumbItem } from "../Breadcrumb";

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
  const countrySeg = country ? normalizeCatalogCountrySlug(country) : undefined;
  const [t, options] = await Promise.all([
    getTranslations("Breadcrumbs"),
    fetchCatalogFilterOptions(locale),
  ]);
  const dealsT = await getTranslations("Catalog.filters");
  const hasCatalogScope = Boolean(city || dealType || propertyType || country || agentSlug);
  const items: BreadcrumbItem[] = [{ label: t("home"), href: `/${locale}` }];
  if (!hasCatalogScope) {
    items.push({ label: "Catalog" });
  }

  const locations = options.locations;
  const propertyTypes = options.propertyTypes;

  if (agentSlug) {
    const agentPath = agentFilterPath({ locale, agentSlug });
    items.push({ label: "Agents", href: agentPath });
    items.push({
      label: agentName || formatSlug(agentSlug),
      href: city || dealType || propertyType ? agentPath : undefined,
    });
  }

  if (country) {
    const normalizedCountry = countrySeg!;
    items.push({ label: "Country", href: `/${locale}/${encodeURIComponent(normalizedCountry)}` });
    items.push({
      label: formatSlug(normalizedCountry),
      href: undefined,
    });
  }

  if (city) {
    const cityLabel =
      locations.find((l) => l.value.toLowerCase() === city.toLowerCase())
        ?.label || formatSlug(city);
    const cityHref = dealType || propertyType
      ? agentSlug
        ? agentFilterPath({ locale, agentSlug, country: countrySeg, city })
        : country
          ? catalogFilterPath({ locale, country: countrySeg, city })
          : singleFilterPath({ locale, city })
      : undefined;
    const cityResetHref = agentSlug
      ? agentFilterPath({ locale, agentSlug })
      : country
        ? `/${locale}/${encodeURIComponent(countrySeg!)}`
        : catalogPath(locale);
    items.push({ label: t("cities"), href: cityResetHref });
    items.push({ label: cityLabel, href: cityHref });
  }

  if (dealType) {
    const dealLabel =
      dealType === "sale"
        ? dealsT("dealSale")
        : dealType === "rent"
          ? dealsT("dealRent")
          : dealType === "short-term-rent"
            ? dealsT("dealShortTerm")
            : formatSlug(dealType);
    const dealHref = propertyType
      ? agentSlug
        ? agentFilterPath({ locale, agentSlug, country: countrySeg, city, dealType })
        : country && city
          ? catalogFilterPath({ locale, country: countrySeg, city, dealType })
          : dealType
            ? nonGeoDealListingPath(locale, dealType)
            : undefined
      : undefined;
    items.push({ label: dealsT("dealType") });
    items.push({ label: dealLabel, href: dealHref });
  }

  if (propertyType) {
    const typeLabel =
      propertyTypes.find((p) => p.value.toLowerCase() === propertyType.toLowerCase())
        ?.label || formatSlug(propertyType);
    const propertyTypeResetHref = agentSlug
      ? agentFilterPath({ locale, agentSlug, country: countrySeg, city, dealType })
      : country && city
        ? catalogFilterPath({
            locale,
            country: countrySeg,
            city,
            dealType,
          })
        : city
          ? singleFilterPath({ locale, city })
          : dealType
            ? nonGeoDealListingPath(locale, dealType)
            : catalogPath(locale);
    items.push({ label: "Property types", href: propertyTypeResetHref });
    items.push({ label: typeLabel });
  }

  const baseUrl = await getBaseUrl();
  const currentPath = buildCurrentPath({
    locale,
    agentSlug,
    country,
    city,
    dealType,
    propertyType,
  });
  const jsonLdItems = items.map((it, i) => ({
    name: it.label,
    url: it.href ?? (i === items.length - 1 ? currentPath : undefined),
  }));

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
