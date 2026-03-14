import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { BreadcrumbItem } from "../Breadcrumb";

type CityLandingBreadcrumbProps = {
  locale: string;
  city: string;
};

export async function CityLandingBreadcrumb({
  locale,
  city,
}: CityLandingBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const { locations } = await fetchCatalogFilterOptions(locale);
  const cityLabel =
    locations.find((l) => l.value.toLowerCase() === city.toLowerCase())
      ?.label || formatSlug(city);

  const items: BreadcrumbItem[] = [
    { label: t("home"), href: `/${locale}` },
    { label: t("cities"), href: `/${locale}/cities` },
    { label: cityLabel },
  ];

  const baseUrl = await getBaseUrl();
  const currentPath = `/${locale}/cities/${encodeURIComponent(city)}`;
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
