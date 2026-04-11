import { permanentRedirect } from "next/navigation";
import { cityInfoPath } from "@/lib/routes/catalog";
import { fetchCityCountrySlugByCitySlug } from "@/lib/sanity/client";

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

/** Legacy editorial URL; canonical is `/[locale]/[country]/[city]/info` with CMS `city.country`. */
export default async function LegacyCityLandingRedirect({ params }: Props) {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const countrySlug = await fetchCityCountrySlugByCitySlug(citySlug);
  permanentRedirect(cityInfoPath(locale, citySlug, countrySlug));
}
