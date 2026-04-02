import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import {
  fetchAgentBySlug,
  fetchCatalogSeoPageByDistrict,
  resolveCatalogSeoPage,
} from "@/lib/sanity/client";
import { parseCatalogFilters } from "@/lib/catalog/parseCatalogFilters";

type Props = {
  params: Promise<{ locale: string; agent: string; city: string; district: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city, district, agent } = await params;
  const parsed = parseCatalogFilters({ city, district, agentSlug: agent }, {});
  const [agentDoc, rawSeo, t] = await Promise.all([
    fetchAgentBySlug(parsed.agentSlug, locale),
    fetchCatalogSeoPageByDistrict(parsed.city, parsed.district),
    getTranslations("Listing.properties"),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const title = agentDoc?.name
    ? `Properties by ${agentDoc.name} — ${parsed.district.replace(/-/g, " ")}`
    : catalogSeo?.metaTitle || t("title");
  const description = catalogSeo?.metaDescription || t("description");
  return { title, description };
}

export default async function CatalogAgentCityDistrictPage({
  params,
  searchParams,
}: Props) {
  const [{ locale, city, district, agent }, search] = await Promise.all([
    params,
    searchParams,
  ]);
  const parsed = parseCatalogFilters({ city, district, agentSlug: agent }, search);
  const agentDoc = await fetchAgentBySlug(parsed.agentSlug, locale);
  if (!agentDoc) notFound();

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageByDistrict(parsed.city, parsed.district);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        agentName={agentDoc.name}
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            agentSlug={parsed.agentSlug}
            agentName={agentDoc.name}
            city={parsed.city}
            district={parsed.district}
          />
        }
      />
      <PropertiesListing
        locale={locale}
        pathAgentSlug={parsed.agentSlug}
        pathCity={parsed.city}
        pathDistrict={parsed.district}
        searchParams={search}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
