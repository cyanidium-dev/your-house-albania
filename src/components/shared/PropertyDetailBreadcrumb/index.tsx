import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildPropertyDetailBreadcrumbItems,
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

  const items = buildPropertyDetailBreadcrumbItems({
    locale,
    homeLabel: t("home"),
    propertiesLabel: t("properties"),
    propertyTitle,
    citySlug,
    districtSlug,
    locations,
    districts,
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
