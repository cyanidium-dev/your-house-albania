import { KnowledgeLinksSection } from "@/components/knowledge/KnowledgeLinks";
import { SeoLabLinksSection } from "@/components/seoLab/SeoLabLinks";
import { KNOWLEDGE_LINKS_BY_CITY } from "@/lib/knowledge/links";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityLandingPageBody } from "@/components/city/CityLandingPageBody";
import {
  fetchCityCountrySlugByCitySlug,
  fetchCityLandingByCitySlug,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { setRequestLocale } from "next-intl/server";
import { fetchPriceIndexSnapshot } from "@/lib/sanity/client";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { findIndexCity } from "@/lib/priceIndex/snapshot";
import { buildCityDatasetJsonLd } from "@/lib/priceIndex/jsonLd";
import { interpolatePriceIndexTokens } from "@/lib/priceIndex/tokens";

/**
 * ISR. Two exports, and the route needs both.
 *
 * `generateStaticParams` is empty on purpose: nothing is prerendered at build
 * time, but declaring it is what puts the route on the incremental path.
 * Without it Next has no params to generate, treats the route as fully
 * dynamic and ignores `revalidate` — which is what left the site's ~1,470
 * content URLs answering `no-store` even after the root layout and the
 * request-locale fixes had made the 86 parameterless pages cacheable.
 *
 * The hour is a backstop, not the publishing delay: the Sanity webhook
 * (`/api/revalidate/sanity`) purges the tags a mutated document touches, so an
 * edit reaches the page as soon as the webhook fires.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ locale: string; country: string; city: string }>;
};

type CityLandingForMeta = {
  title?: unknown;
  subtitle?: unknown;
  cardDescription?: unknown;
  seo?: unknown;
  linkedCity?: {
    title?: unknown;
    shortDescription?: unknown;
    heroImage?: { asset?: { url?: string } };
  };
};

function normalizeSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city } = await params;
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    return {};
  }
  const [cmsLanding, siteSettings, snapshot] = await Promise.all([
    fetchCityLandingByCitySlug(citySlug),
    fetchSiteSettings(),
    fetchPriceIndexSnapshot(),
  ]);
  // Same token pass as the page body: a meta description can quote the live median.
  const landing = interpolatePriceIndexTokens(cmsLanding, snapshot, locale);
  const seo = (landing as CityLandingForMeta | null)?.seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  const doc = landing as CityLandingForMeta | null;
  const itemTitle =
    resolveLocalizedString(doc?.title as never, locale) ||
    resolveLocalizedString(doc?.linkedCity?.title as never, locale) ||
    citySlug;
  const itemDescription =
    resolveLocalizedString(doc?.subtitle as never, locale) ||
    resolveLocalizedString(doc?.cardDescription as never, locale) ||
    resolveLocalizedString(doc?.linkedCity?.shortDescription as never, locale) ||
    undefined;
  const itemOgImageUrl = doc?.linkedCity?.heroImage?.asset?.url;

  const pathAfterLocale = `${cmsCountry}/${citySlug}/info`;
  return buildLandingMetadata(seo as never, siteDefaultSeo as never, locale, {
    itemTitle,
    itemDescription,
    itemOgImageUrl,
    pathnameForAlternates: pathAfterLocale,
    contentUpdatedAt: (landing as { contentUpdatedAt?: string } | null)?.contentUpdatedAt,
  });
}

export default async function CityInfoLandingPage({ params }: Props) {
  const { locale, country, city } = await params;
  setRequestLocale(locale);
  const countrySlug = normalizeSegment(country);
  const citySlug = normalizeSegment(city);
  if (!citySlug) notFound();

  const cmsCountry = await fetchCityCountrySlugByCitySlug(citySlug);
  if (!cmsCountry || cmsCountry !== countrySlug) {
    notFound();
  }

  // The city's Domlivo Price Index Dataset, on every city's page (it used to
  // ride along with the district table, which a city with one district never
  // renders). Same snapshot as the figures on the page.
  const [snapshot, baseUrl] = await Promise.all([fetchPriceIndexSnapshot(), getBaseUrl()]);
  const indexCity = findIndexCity(snapshot, citySlug);
  const dataset =
    snapshot && indexCity ? buildCityDatasetJsonLd({ baseUrl, locale, snapshot, city: indexCity }) : null;

  return (
    <>
      {dataset ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset).replace(/</g, "\\u003c") }}
        />
      ) : null}
      <CityLandingPageBody locale={locale} citySlug={citySlug} />
      <KnowledgeLinksSection locale={locale} slugs={KNOWLEDGE_LINKS_BY_CITY[citySlug] ?? []} />
      <SeoLabLinksSection locale={locale} path={`/${locale}/${countrySlug}/${citySlug}/info`} />
    </>
  );
}
