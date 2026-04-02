import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { catalogPath } from "@/lib/routes/catalog";
import type { BreadcrumbItem } from "../Breadcrumb";

type CatalogBreadcrumbProps = {
  locale: string;
  agentSlug?: string;
  agentName?: string;
  city?: string;
  district?: string;
};

export async function CatalogBreadcrumb({
  locale,
  agentSlug,
  agentName,
  city,
  district,
}: CatalogBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const items: BreadcrumbItem[] = [
    { label: t("home"), href: `/${locale}` },
    {
      label: t("properties"),
      href: city || district || agentSlug ? `/${locale}/properties` : undefined,
    },
  ];

  let locations: { value: string; label: string }[] = [];
  let districts: { value: string; label: string; citySlug?: string }[] = [];

  if (city || district) {
    const opts = await fetchCatalogFilterOptions(locale);
    locations = opts.locations;
    districts = opts.districts;
  }

  if (agentSlug) {
    items.push({
      label: agentName || formatSlug(agentSlug),
      href: city || district
        ? catalogPath(locale, undefined, undefined, agentSlug)
        : undefined,
    });
  }

  if (city) {
    const cityLabel =
      locations.find((l) => l.value.toLowerCase() === city.toLowerCase())
        ?.label || formatSlug(city);
    const cityHref = district
      ? catalogPath(locale, city, undefined, agentSlug)
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
  const currentPath = buildCurrentPath(locale, agentSlug, city, district);
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
  agentSlug?: string,
  city?: string,
  district?: string
): string {
  return catalogPath(locale, city, district, agentSlug);
}
