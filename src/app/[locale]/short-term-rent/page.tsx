import type { Metadata } from "next";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import { getTranslations } from "next-intl/server";
import { fetchCatalogSeoPageRoot, resolveCatalogSeoPage } from "@/lib/sanity/client";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { shouldCatalogListingNoindex } from "@/lib/seo/catalogListingMetadata";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled, indexingDisabledRobots } from "@/lib/seo/envSeo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const search = await searchParams;
  const t = await getTranslations("Listing.properties");
  const rawSeo = await fetchCatalogSeoPageRoot();
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const title = catalogSeo?.metaTitle || `${t("title")} — short-term-rent`;
  const description = catalogSeo?.metaDescription || t("description");
  if (!isIndexingEnabled()) return { title, description, robots: indexingDisabledRobots };
  const canonicalPath = "/short-term-rent";
  const href = buildHreflangAlternates(canonicalPath);
  const base = getSiteBaseUrl();
  const robots =
    shouldCatalogListingNoindex({ ...search, deal: "short-term" }) || (catalogSeo?.noIndex ?? false)
      ? { index: false as const, follow: true as const }
      : undefined;
  return {
    title,
    description,
    alternates: {
      canonical: `${base}/${locale}${canonicalPath}`,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function ShortTermRentFilterPage({ params, searchParams }: Props) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  const mergedSearch = { ...search, deal: "short-term" };
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
        breadcrumb={<CatalogBreadcrumb locale={locale} />}
      />
      <PropertiesListing
        locale={locale}
        searchParams={mergedSearch}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
