import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import {
  fetchAgentBySlug,
  fetchCatalogSeoPageRoot,
  resolveCatalogSeoPage,
} from "@/lib/sanity/client";
import { parseCatalogFilters } from "@/lib/catalog/parseCatalogFilters";

type Props = {
  params: Promise<{ locale: string; agent: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, agent } = await params;
  const parsed = parseCatalogFilters({ agentSlug: agent }, {});
  const [agentDoc, rawSeo, t] = await Promise.all([
    fetchAgentBySlug(parsed.agentSlug, locale),
    fetchCatalogSeoPageRoot(),
    getTranslations("Listing.properties"),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const title = agentDoc?.name
    ? `Properties by ${agentDoc.name}`
    : catalogSeo?.metaTitle || t("title");
  const description = catalogSeo?.metaDescription || t("description");
  return { title, description };
}

export default async function CatalogAgentPage({ params, searchParams }: Props) {
  const [{ locale, agent }, search] = await Promise.all([params, searchParams]);
  const parsed = parseCatalogFilters({ agentSlug: agent }, search);
  const agentDoc = await fetchAgentBySlug(parsed.agentSlug, locale);
  if (!agentDoc) notFound();

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo = await fetchCatalogSeoPageRoot();
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
          />
        }
      />
      <PropertiesListing
        locale={locale}
        pathAgentSlug={parsed.agentSlug}
        searchParams={search}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
