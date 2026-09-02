import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import PropertiesListing from "@/components/Properties/PropertyList";
import { FlatBreadcrumb } from "@/components/shared/FlatBreadcrumb";
import { fetchCatalogProperties } from "@/lib/sanity/client";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { indexingDisabledRobots } from "@/lib/seo/envSeo";
import { shouldNoindexEmptyCityListing } from "@/lib/seo/listingIndexPolicy";
import { catalogPath } from "@/lib/routes/catalog";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PATH = "investment/new-builds";

/**
 * Everything still being built, in one place.
 *
 * The catalogue can already answer this as a filter (`?stage=unfinished`), but
 * a filter is not a page: it cannot carry the explanation an off-plan buyer
 * needs, and it is deliberately noindexed like every other filtered URL. This
 * is the indexable answer to "new builds in Albania", and it says out loud what
 * the listings themselves record — the stage, the promised handover, and
 * whether the ownership certificate exists yet.
 */
async function countUnfinished(): Promise<number> {
  const result = await fetchCatalogProperties({ stage: "unfinished", page: 1, pageSize: 1 });
  return result?.totalCount ?? 0;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NewBuilds" });
  const total = await countUnfinished();

  return {
    title: t("title"),
    description: t("description"),
    alternates: await buildHreflangAlternates(PATH),
    // Same rule the city listings follow: a page with nothing on it does not
    // belong in the index. It stays reachable, it just stops being advertised.
    ...(shouldNoindexEmptyCityListing(total) ? { robots: indexingDisabledRobots } : {}),
  };
}

export default async function NewBuildsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const search = (await searchParams) ?? {};
  const t = await getTranslations({ locale, namespace: "NewBuilds" });
  const total = await countUnfinished();

  const hero = (
    <CatalogHero
      title={t("heading")}
      badge={t("badge")}
      intro={null}
      introFallback={t("description")}
      breadcrumb={
        <FlatBreadcrumb locale={locale} labelKey="newBuilds" path={PATH} overHero />
      }
    />
  );

  if (total === 0) {
    return (
      <>
        {hero}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
            <p className="max-w-3xl text-base md:text-lg leading-relaxed text-dark/70 dark:text-white/70">
              {t("empty")}
            </p>
            <Link
              href={catalogPath(locale)}
              className="mt-8 inline-flex items-center justify-center h-11 px-8 rounded-full font-semibold bg-primary text-white hover:bg-dark transition-colors duration-200 ease-out"
            >
              {t("emptyCta")}
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {hero}
      <section className="pt-10 md:pt-14">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <p className="max-w-3xl text-base md:text-lg leading-relaxed text-dark/70 dark:text-white/70">
            {t("intro")}
          </p>
        </div>
      </section>
      <PropertiesListing
        locale={locale}
        // The stage is the page, not a filter the visitor happened to pick, so
        // it is forced on top of whatever else they narrow by.
        searchParams={{ ...search, stage: "unfinished" }}
        catalogSeo={null}
      />
    </>
  );
}
