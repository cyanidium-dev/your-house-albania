import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import {
  fetchAgentBySlug,
  fetchCatalogSeoPageByCity,
  resolveCatalogSeoPage,
} from "@/lib/sanity/client";
import { parseCatalogFilters } from "@/lib/catalog/parseCatalogFilters";
import { catalogPath } from "@/lib/routes/catalog";

function buildQueryString(
  search: Record<string, string | string[] | undefined>,
  exclude: string[]
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (exclude.includes(k)) continue;
    if (typeof v === "string") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

type Props = {
  params: Promise<{ locale: string; agent: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city, agent } = await params;
  const parsed = parseCatalogFilters({ city, agentSlug: agent }, {});
  const [agentDoc, rawSeo, t] = await Promise.all([
    fetchAgentBySlug(parsed.agentSlug, locale),
    fetchCatalogSeoPageByCity(parsed.city),
    getTranslations("Listing.properties"),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const title = agentDoc?.name
    ? `Properties by ${agentDoc.name} — ${parsed.city.replace(/-/g, " ")}`
    : catalogSeo?.metaTitle || t("title");
  const description = catalogSeo?.metaDescription || t("description");
  return { title, description };
}

export default async function CatalogAgentCityPage({ params, searchParams }: Props) {
  const [{ locale, city, agent }, search] = await Promise.all([params, searchParams]);
  const parsed = parseCatalogFilters({ city, agentSlug: agent }, search);
  if (parsed.district) {
    redirect(
      `${catalogPath(locale, parsed.city, parsed.district, parsed.agentSlug)}${buildQueryString(search, [
        "district",
      ])}`
    );
  }

  const agentDoc = await fetchAgentBySlug(parsed.agentSlug, locale);
  if (!agentDoc) notFound();

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageByCity(parsed.city);
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
          />
        }
      />
      <PropertiesListing
        locale={locale}
        pathAgentSlug={parsed.agentSlug}
        pathCity={parsed.city}
        searchParams={search}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
