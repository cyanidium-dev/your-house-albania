import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { BreadcrumbItem } from "../Breadcrumb";

type CatalogBreadcrumbProps = {
  locale: string;
  city?: string;
  district?: string;
};

export async function CatalogBreadcrumb({
  locale,
  city,
  district,
}: CatalogBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const items: BreadcrumbItem[] = [
    { label: t("home"), href: `/${locale}` },
    { label: t("properties"), href: city ? `/${locale}/properties` : undefined },
  ];

  let locations: { value: string; label: string }[] = [];
  let districts: { value: string; label: string; citySlug?: string }[] = [];

  if (city || district) {
    const opts = await fetchCatalogFilterOptions(locale);
    locations = opts.locations;
    districts = opts.districts;
  }

  if (city) {
    const cityLabel =
      locations.find((l) => l.value.toLowerCase() === city.toLowerCase())
        ?.label || formatSlug(city);
    const cityHref = district
      ? `/${locale}/properties/${encodeURIComponent(city)}`
      : undefined;
    items.push({ label: cityLabel, href: cityHref });
  }

  if (district) {
    const districtLabel =
      districts.find((d) => d.value.toLowerCase() === district.toLowerCase())
        ?.label || formatSlug(district);
    items.push({ label: districtLabel });
  }

  const baseUrl = await getBaseUrl();
  const currentPath = buildCurrentPath(locale, city, district);
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

function buildCurrentPath(
  locale: string,
  city?: string,
  district?: string
): string {
  const base = `/${locale}/properties`;
  if (!city) return base;
  if (!district) return `${base}/${encodeURIComponent(city)}`;
  return `${base}/${encodeURIComponent(city)}/${encodeURIComponent(district)}`;
}
