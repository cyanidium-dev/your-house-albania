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
  const [landing, siteSettings] = await Promise.all([
    fetchCityLandingByCitySlug(citySlug),
    fetchSiteSettings(),
  ]);
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

  return <CityLandingPageBody locale={locale} citySlug={citySlug} />;
}
