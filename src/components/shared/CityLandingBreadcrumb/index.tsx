import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { cityInfoPath } from "@/lib/routes/catalog";
import type { BreadcrumbItem } from "../Breadcrumb";

type CityLandingBreadcrumbProps = {
  locale: string;
  city: string;
  /** When true, uses light text for overlay on dark hero imagery */
  overHero?: boolean;
};

export async function CityLandingBreadcrumb({
  locale,
  city,
  overHero,
}: CityLandingBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const { locations } = await fetchCatalogFilterOptions(locale);
  const locationMatch = locations.find(
    (l) => l.value.toLowerCase() === city.toLowerCase()
  );
  const cityLabel = locationMatch?.label || formatSlug(city);

  const items: BreadcrumbItem[] = [
    { label: t("home"), href: `/${locale}` },
    { label: t("cities"), href: `/${locale}/cities` },
    { label: cityLabel },
  ];

  const baseUrl = await getBaseUrl();
  const currentPath = cityInfoPath(locale, city, locationMatch?.countrySlug);
  const jsonLdItems = items.map((it, i) => ({
    name: it.label,
    url: it.href ?? (i === items.length - 1 ? currentPath : undefined),
  }));

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}

function formatSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
