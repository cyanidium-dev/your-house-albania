import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { BreadcrumbItem } from "../Breadcrumb";

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
  const items: BreadcrumbItem[] = [
    { label: t("home"), href: `/${locale}` },
    { label: t("properties"), href: `/${locale}/properties` },
  ];

  let locations: { value: string; label: string }[] = [];
  let districts: { value: string; label: string }[] = [];

  if (citySlug || districtSlug) {
    const opts = await fetchCatalogFilterOptions(locale);
    locations = opts.locations;
    districts = opts.districts;
  }

  if (citySlug) {
    const city = citySlug.toLowerCase();
    const cityLabel =
      locations.find((l) => l.value.toLowerCase() === city)?.label ||
      formatSlug(citySlug);
    const cityHref = `/${locale}/properties/${encodeURIComponent(citySlug)}`;
    items.push({ label: cityLabel, href: cityHref });
  }

  if (districtSlug && citySlug) {
    const district = districtSlug.toLowerCase();
    const districtLabel =
      districts.find((d) => d.value.toLowerCase() === district)?.label ||
      formatSlug(districtSlug);
    items.push({
      label: districtLabel,
      href: `/${locale}/properties/${encodeURIComponent(citySlug!)}/${encodeURIComponent(districtSlug)}`,
    });
  }

  items.push({ label: propertyTitle });

  const baseUrl = await getBaseUrl();
  const currentPath = `/${locale}/property/${encodeURIComponent(propertySlug)}`;
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
