import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildCityLandingBreadcrumbItems,
  buildCityLandingCurrentPath,
  formatBreadcrumbSlug,
  toBreadcrumbJsonLdItems,
} from "@/lib/routes/breadcrumbs";

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
  const cityLabel = locationMatch?.label || formatBreadcrumbSlug(city);

  const items = buildCityLandingBreadcrumbItems({
    locale,
    homeLabel: t("home"),
    citiesLabel: t("cities"),
    cityLabel,
  });

  const baseUrl = await getBaseUrl();
  const currentPath = buildCityLandingCurrentPath({
    locale,
    city,
    countrySlug: locationMatch?.countrySlug,
  });
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}
