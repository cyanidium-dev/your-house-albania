import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { fetchCityLandingByCitySlug, fetchDistrictBySlugs } from "@/lib/sanity/client";
import { cityInfoPath, districtInfoPath } from "@/lib/routes/catalog";

type Props = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  cityLabel: string;
  districtSlug?: string;
  districtLabel?: string;
};

/**
 * From a place's listing to the page that explains the place: its prices,
 * districts and FAQ. The prices pages link down to the listings, but nothing
 * linked back up — a city or district listing carried only its breadcrumb and
 * the cards. Renders nothing when the place has no published page.
 */
export async function ListingPlaceInfoLink({
  locale,
  countrySlug,
  citySlug,
  cityLabel,
  districtSlug,
  districtLabel,
}: Props) {
  const t = await getTranslations({ locale, namespace: "Catalog" });

  let href: string | null = null;
  let label = "";
  if (districtSlug) {
    const district = await fetchDistrictBySlugs(citySlug, districtSlug);
    if (district) {
      href = districtInfoPath(locale, citySlug, districtSlug, countrySlug);
      label = t("districtInfoLink", { place: `${districtLabel || districtSlug}, ${cityLabel}` });
    }
  } else if (await fetchCityLandingByCitySlug(citySlug)) {
    href = cityInfoPath(locale, citySlug, countrySlug);
    label = t("cityInfoLink", { place: cityLabel });
  }
  if (!href) return null;

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-white/40 px-5 py-2 text-sm font-semibold !text-white hover:bg-white/10 transition-colors"
    >
      {label}
    </Link>
  );
}
