import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildCatalogCrumbs,
  formatBreadcrumbSlug,
  toBreadcrumbJsonLdItems,
  type BreadcrumbLocation,
  type BreadcrumbDistrict,
} from "@/lib/routes/breadcrumbs";

type PropertyDetailBreadcrumbProps = {
  locale: string;
  propertyTitle: string;
  propertySlug: string;
  citySlug?: string | null;
  districtSlug?: string | null;
};

export async function PropertyDetailBreadcrumb({
  locale,
  propertyTitle,
  propertySlug,
  citySlug,
  districtSlug,
}: PropertyDetailBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");

  let locations: BreadcrumbLocation[] = [];
  let districts: BreadcrumbDistrict[] = [];

  if (citySlug || districtSlug) {
    const opts = await fetchCatalogFilterOptions(locale);
    locations = opts.locations;
    districts = opts.districts;
  }

  // A listing is a catalog leaf, so its trail stays on the catalog spine — the
  // one place a district name legitimately means "listings in that district".
  const city = citySlug
    ? {
        slug: citySlug,
        label:
          locations.find((l) => l.value.toLowerCase() === citySlug.toLowerCase())?.label ||
          formatBreadcrumbSlug(citySlug),
      }
    : undefined;
  const district = districtSlug
    ? {
        slug: districtSlug,
        label:
          districts.find((d) => d.value.toLowerCase() === districtSlug.toLowerCase())?.label ||
          formatBreadcrumbSlug(districtSlug),
      }
    : undefined;

  const items = buildCatalogCrumbs({
    locale,
    labels: {home: t("home"), properties: t("catalog"), agents: t("agents")},
    city,
    district,
    leaf: propertyTitle,
  });

  const baseUrl = await getBaseUrl();
  const currentPath = `/${locale}/property/${encodeURIComponent(propertySlug)}`;
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} />
    </>
  );
}
