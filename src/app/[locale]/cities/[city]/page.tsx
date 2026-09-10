import { permanentRedirect } from "next/navigation";
import { cityInfoPath } from "@/lib/routes/catalog";
import { fetchCityCountrySlugByCitySlug } from "@/lib/sanity/client";
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
  params: Promise<{ locale: string; city: string }>;
};

/** Legacy editorial URL; canonical is `/[locale]/[country]/[city]/info` with CMS `city.country`. */
export default async function LegacyCityLandingRedirect({ params }: Props) {
  const { locale, city } = await params;
  setRequestLocale(locale);
  const citySlug = decodeURIComponent(city).toLowerCase();
  const countrySlug = await fetchCityCountrySlugByCitySlug(citySlug);
  permanentRedirect(cityInfoPath(locale, citySlug, countrySlug));
}
