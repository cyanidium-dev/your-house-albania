import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { districtInfoPath, districtsHubPath } from "@/lib/routes/catalog";
import {
  buildDistrictsBreadcrumbItems,
  formatBreadcrumbSlug,
  toBreadcrumbJsonLdItems,
} from "@/lib/routes/breadcrumbs";

type DistrictsBreadcrumbProps = {
  locale: string;
  country: string;
  city: string;
  /** Slug of the current district; omit on the districts hub page. */
  district?: string;
  /** Label of the current district (localized); falls back to formatted slug. */
  districtLabel?: string;
  /** When true, uses light text for overlay on dark hero imagery */
  overHero?: boolean;
};

export async function DistrictsBreadcrumb({
  locale,
  country,
  city,
  district,
  districtLabel,
  overHero,
}: DistrictsBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const { locations } = await fetchCatalogFilterOptions(locale);
  const locationMatch = locations.find((l) => l.value.toLowerCase() === city.toLowerCase());
  const cityLabel = locationMatch?.label || formatBreadcrumbSlug(city);
  const countrySlug = (locationMatch?.countrySlug || country).toLowerCase();

  const items = buildDistrictsBreadcrumbItems({
    locale,
    homeLabel: t("home"),
    countryLabel: formatBreadcrumbSlug(countrySlug),
    countrySlug,
    cityLabel,
    citySlug: city,
    districtsLabel: t("districts"),
    districtLabel: district ? districtLabel || formatBreadcrumbSlug(district) : undefined,
  });

  const baseUrl = await getBaseUrl();
  const currentPath = district
    ? districtInfoPath(locale, city, district, countrySlug)
    : districtsHubPath(locale, city, countrySlug);
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}
