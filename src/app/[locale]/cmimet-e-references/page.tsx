import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReferencePricesView } from "@/components/referencePrices/ReferencePricesView";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { fetchPriceIndexSnapshot } from "@/lib/sanity/queries/priceIndex";
import { REFERENCE_PRICES_LOCALE, REFERENCE_PRICES_PATH } from "@/lib/referencePrices/data";
import { REFERENCE_PRICES_COPY } from "@/lib/referencePrices/copy";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { getSiteBaseUrl } from "@/lib/siteUrl";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/sq/cmimet-e-references`: the state reference prices for flats with a
 * calculator (SEO hypothesis 5, lab experiment E01, 2026-10-21). Albanian
 * only: every other locale is a 404. See `lib/referencePrices/data.ts`.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return [{ locale: REFERENCE_PRICES_LOCALE }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== REFERENCE_PRICES_LOCALE) return {};
  return buildSimplePageMetadata({
    locale,
    title: REFERENCE_PRICES_COPY.metaTitle,
    description: REFERENCE_PRICES_COPY.metaDescription,
    pathAfterLocale: REFERENCE_PRICES_PATH,
    locales: [REFERENCE_PRICES_LOCALE],
    robots: { index: true, follow: true },
  });
}

export default async function ReferencePricesPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== REFERENCE_PRICES_LOCALE) notFound();
  setRequestLocale(locale);
  const [snapshot, tCrumbs] = await Promise.all([
    fetchPriceIndexSnapshot(),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
  ]);
  return (
    <>
      <ReferencePricesView
        locale={locale}
        baseUrl={getSiteBaseUrl()}
        snapshot={snapshot}
        homeLabel={tCrumbs("home")}
      />
      <ListingContactBar locale={locale} />
    </>
  );
}
