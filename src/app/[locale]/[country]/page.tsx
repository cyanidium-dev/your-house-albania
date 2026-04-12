import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import { getTranslations } from "next-intl/server";
import {
  fetchCatalogSeoPageByCity,
  fetchCatalogSeoPageRoot,
  fetchCityCountrySlugByCitySlug,
  fetchSiteSettings,
  resolveCatalogSeoPage,
} from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import {
  listingUrlHasQueryParams,
  shouldCatalogListingNoindex,
} from "@/lib/seo/catalogListingMetadata";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { catalogFilterPath, singleFilterPath } from "@/lib/routes/catalog";
import {
  mergeTopLevelSearch,
  resolveTopLevelListingSegment,
  type TopLevelResolvedKind,
} from "@/lib/routes/listingRouteResolver";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<SearchParams>;
};

type ResolvedKind = TopLevelResolvedKind;

async function buildListingMetadata(
  locale: string,
  kind: ResolvedKind,
  slug: string,
  search: SearchParams
): Promise<Metadata> {
  const [siteSettings, rawSeo, t] = await Promise.all([
    fetchSiteSettings(),
    kind === "city" ? fetchCatalogSeoPageByCity(slug) : fetchCatalogSeoPageRoot(),
    getTranslations("Listing.properties"),
  ]);
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);
  const defaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo as
    | { metaTitle?: Record<string, string>; metaDescription?: Record<string, string> }
    | undefined;
  const listTitle = t("title");
  const listDescription = t("description");
  const localizedTitleFromSeo =
    defaultSeo?.metaTitle && resolveLocalizedString(defaultSeo.metaTitle as never, locale);
  const localizedDescriptionFromSeo =
    defaultSeo?.metaDescription &&
    resolveLocalizedString(defaultSeo.metaDescription as never, locale);

  const humanSlug = slug.replace(/-/g, " ");
  const title =
    catalogSeo?.metaTitle ||
    (kind === "country" ? listTitle : `${listTitle} — ${humanSlug}`) ||
    (localizedTitleFromSeo ? `${listTitle} | ${localizedTitleFromSeo}` : listTitle);
  const description = catalogSeo?.metaDescription || localizedDescriptionFromSeo || listDescription;

  if (!isIndexingEnabled()) {
    return { title, description, robots: indexingDisabledRobots };
  }

  let path: string;
  if (kind === "city") {
    const cc = await fetchCityCountrySlugByCitySlug(slug);
    path = cc
      ? catalogFilterPath({ locale, city: slug, country: cc, trustedCityCountrySlug: cc })
      : catalogFilterPath({ locale, city: slug });
  } else {
    path = singleFilterPath({
      locale,
      dealType: kind === "deal" ? slug : undefined,
      propertyType: kind === "type" ? slug : undefined,
    });
  }
  /** Country hub: CMS country index (`/{locale}/{country}`), not a listing shorthand — kept explicit vs `buildListingUrl`. */
  const canonicalPath = kind === "country" ? `/${locale}/${encodeURIComponent(slug)}` : path;
  const base = getSiteBaseUrl();
  const canonical = `${base}${canonicalPath}`;
  const href = buildHreflangAlternates(canonicalPath.replace(`/${locale}`, ""));
  const ignoredQueryKeys =
    kind === "deal"
      ? ["deal"]
      : kind === "type"
        ? ["type"]
        : kind === "city"
          ? ["city"]
          : [];
  const robots =
    listingUrlHasQueryParams(search) ||
    shouldCatalogListingNoindex(search, { ignoredQueryKeys }) ||
    (catalogSeo?.noIndex ?? false)
      ? { index: false as const, follow: true as const }
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, country }, search] = await Promise.all([params, searchParams]);
  const resolved = await resolveTopLevelListingSegment(locale, country);
  if (!resolved) return {};
  if (resolved.kind === "ambiguous") {
    const t = await getTranslations("Listing.properties");
    return { title: t("title"), description: t("description"), robots: { index: false, follow: true } };
  }
  const mergedSearch = mergeTopLevelSearch(search, resolved);
  return buildListingMetadata(locale, resolved.kind, resolved.slug, mergedSearch);
}

export default async function TopLevelSingleFilterPage({ params, searchParams }: Props) {
  const [{ locale, country }, search] = await Promise.all([params, searchParams]);
  const resolved = await resolveTopLevelListingSegment(locale, country);
  if (!resolved) notFound();
  const mergedSearch = resolved.kind === "ambiguous" ? search : mergeTopLevelSearch(search, resolved);

  const t = await getTranslations("Listing.properties");
  const tCatalog = await getTranslations("Catalog");
  const rawSeo =
    resolved.kind === "city"
      ? await fetchCatalogSeoPageByCity(resolved.slug)
      : await fetchCatalogSeoPageRoot();
  const catalogSeo = resolveCatalogSeoPage(rawSeo, locale);

  return (
    <>
      <CatalogHero
        title={catalogSeo?.title || t("title")}
        badge={t("badge")}
        intro={catalogSeo?.intro && catalogSeo.intro.length > 0 ? catalogSeo.intro : null}
        introFallback={tCatalog("heroIntroFallback")}
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            country={resolved.kind === "country" ? resolved.slug : undefined}
            city={resolved.kind === "city" ? resolved.slug : undefined}
            dealType={resolved.kind === "deal" ? resolved.slug : undefined}
            propertyType={resolved.kind === "type" ? resolved.slug : undefined}
          />
        }
      />
      {resolved.kind === "ambiguous" ? (
        <section className="container max-w-8xl mx-auto px-5 2xl:px-0 pb-4">
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100">
            This URL slug is ambiguous (`{resolved.slug}`) and can match multiple filter groups ({resolved.matches.join(", ")}). Use a geo path `/{locale}/[country]/{resolved.slug}` where `[country]` matches the city&apos;s country in CMS.
          </div>
        </section>
      ) : null}
      <PropertiesListing
        locale={locale}
        pathCity={resolved.kind === "city" ? resolved.slug : ""}
        searchParams={mergedSearch}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
