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
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled, indexingDisabledRobots } from "@/lib/seo/envSeo";
import { shouldCatalogListingNoindex } from "@/lib/seo/catalogListingMetadata";
import { agentFilterPath } from "@/lib/routes/catalog";

type Props = {
  params: Promise<{ locale: string; agent: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, agent }, search] = await Promise.all([params, searchParams]);
  const parsed = parseCatalogFilters({ agentSlug: agent }, search);
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
  if (!isIndexingEnabled()) return { title, description, robots: indexingDisabledRobots };

  const path = agentFilterPath({ locale, agentSlug: parsed.agentSlug });
  const base = getSiteBaseUrl();
  const href = buildHreflangAlternates(path.replace(`/${locale}`, ""));
  const robots =
    shouldCatalogListingNoindex(search) || (catalogSeo?.noIndex ?? false)
      ? { index: false as const, follow: true as const }
      : undefined;
  return {
    title,
    description,
    alternates: {
      canonical: `${base}${path}`,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function AgentCatalogPage({ params, searchParams }: Props) {
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
