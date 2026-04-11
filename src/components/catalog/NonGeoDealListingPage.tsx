import { notFound, redirect } from "next/navigation";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import { getTranslations } from "next-intl/server";
import {
  fetchCatalogFilterOptions,
  fetchCatalogSeoPageRoot,
  resolveCatalogSeoPage,
} from "@/lib/sanity/client";
import { getNonGeoDealListingRedirectUrl } from "@/lib/routes/listingRouteResolver";
import type { PropertiesDealParam } from "@/lib/catalog/propertiesDealFromLanding";

function normalizeSeg(s: string): string {
  return decodeURIComponent(s).trim().toLowerCase();
}

export async function NonGeoDealListingPage({
  locale,
  dealRouteSegment,
  dealQuery,
  filters,
  searchParams,
}: {
  locale: string;
  dealRouteSegment: "sale" | "rent" | "short-term-rent";
  dealQuery: PropertiesDealParam;
  filters: string[] | undefined;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (filters && filters.length > 1) notFound();

  const rawTypeSeg = filters?.[0];
  const propertyTypeSegment = rawTypeSeg
    ? decodeURIComponent(rawTypeSeg).trim()
    : "";

  if (rawTypeSeg && !propertyTypeSegment) notFound();

  const search =
    searchParams && typeof searchParams === "object" ? searchParams : {};

  const options = await fetchCatalogFilterOptions(locale);

  if (propertyTypeSegment) {
    const known = options.propertyTypes.some(
      (p) => normalizeSeg(p.value) === normalizeSeg(propertyTypeSegment)
    );
    if (!known) notFound();
  }

  if (!propertyTypeSegment) {
    const typeQ = typeof search.type === "string" ? search.type.trim() : "";
    if (typeQ) {
      const nt = normalizeSeg(typeQ);
      const known = options.propertyTypes.some((p) => normalizeSeg(p.value) === nt);
      if (known) {
        const r = getNonGeoDealListingRedirectUrl({
          locale,
          dealRouteSegment,
          dealQuery,
          propertyTypeFromPath: propertyTypeSegment,
          search,
        });
        if (r) redirect(r);
      }
    }
  } else {
    const r = getNonGeoDealListingRedirectUrl({
      locale,
      dealRouteSegment,
      dealQuery,
      propertyTypeFromPath: propertyTypeSegment,
      search,
    });
    if (r) redirect(r);
  }

  const mergedSearch: Record<string, string | string[] | undefined> = {
    ...search,
    deal: dealQuery,
  };
  if (propertyTypeSegment) {
    mergedSearch.type = propertyTypeSegment;
  }

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
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            dealType={dealRouteSegment}
            propertyType={propertyTypeSegment || undefined}
          />
        }
      />
      <PropertiesListing
        locale={locale}
        searchParams={mergedSearch}
        catalogSeo={catalogSeo ? { bottomText: catalogSeo.bottomText } : null}
      />
    </>
  );
}
