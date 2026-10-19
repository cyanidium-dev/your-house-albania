import Link from "@/components/shared/Link";
import { getTranslations } from "next-intl/server";
import { fetchCatalogFilterOptions, fetchSeoPageDecisions } from "@/lib/sanity/client";
import { catalogFilterPath } from "@/lib/routes/catalog";
import { resolveCityDisplayName } from "@/lib/seo/listingSeoCopy";
import { resolveCatalogTargets } from "@/lib/inventoryLinks/places";
import { isListingTopicIndexable } from "@/lib/inventoryLinks/indexing";
import { cityInfoHrefIfIndexable } from "@/lib/inventoryLinks/server";
import { fetchPartnerPlaceListings } from "@/lib/sanity/queries/partnerLandings";
import {
  PARTNER_LANDING_MIN_LISTINGS,
  PARTNER_NAME,
  PARTNER_SLUG,
  partnerLandingForPlace,
  partnerLandingPath,
} from "@/lib/partnerLandings/config";
import { selectPartnerListings } from "@/lib/partnerLandings/facts";

type Props = {
  locale: string;
  citySlug?: string | null;
  districtSlug?: string | null;
  /** The lister's slug: a partner with a landing for this place gets a link to it. */
  agentSlug?: string | null;
};

/**
 * Under a listing's location line: its district's listing page and its city's
 * price page (B5). The district is linked only when the SEO registry indexes
 * its page in this locale, else the city's listing page is (the convention of
 * `districtLinkTargets`); the price page when the city has one. Nothing when
 * neither exists.
 */
export async function ListingPlaceLinks({ locale, citySlug, districtSlug, agentSlug }: Props) {
  const city = (citySlug ?? "").trim().toLowerCase();
  if (!city) return null;
  const district = (districtSlug ?? "").trim().toLowerCase() || undefined;

  const [t, options, decisions] = await Promise.all([
    getTranslations({ locale, namespace: "InventoryLinks" }),
    fetchCatalogFilterOptions(locale),
    fetchSeoPageDecisions(),
  ]);
  const country = options.locations.find((l) => l.value.toLowerCase() === city)?.countrySlug;
  if (!country) return null;

  const [target] = resolveCatalogTargets([{ city, district }], (topic) =>
    isListingTopicIndexable(decisions, { ...topic, country }, locale)
  );
  const [cityName, infoHref] = await Promise.all([
    resolveCityDisplayName(city, locale),
    cityInfoHrefIfIndexable(locale, city, country),
  ]);

  const links: { href: string; label: string }[] = [];
  if (target) {
    const districtLabel = target.district
      ? options.districts.find((d) => d.value.toLowerCase() === target.district)?.label || target.district
      : "";
    links.push({
      href: catalogFilterPath({
        locale,
        country,
        trustedCityCountrySlug: country,
        city,
        district: target.district,
      }),
      label: target.district
        ? t("districtListings", { district: districtLabel })
        : t("cityListings", { city: cityName }),
    });
  }
  if (infoHref) links.push({ href: infoHref, label: t("cityPrices", { city: cityName }) });
  // The partner's selection in this place (lib/partnerLandings), on the partner's own listings.
  const partnerLanding = agentSlug === PARTNER_SLUG ? partnerLandingForPlace({ city, district }) : null;
  if (partnerLanding) {
    const count = selectPartnerListings(await fetchPartnerPlaceListings(partnerLanding), partnerLanding).length;
    if (count >= PARTNER_LANDING_MIN_LISTINGS) {
      const tPartner = await getTranslations({ locale, namespace: "PartnerLanding" });
      const placeLabel = partnerLanding.place.district
        ? options.districts.find((d) => d.value.toLowerCase() === partnerLanding.place.district)?.label || partnerLanding.place.district
        : cityName;
      links.push({
        href: partnerLandingPath(locale, partnerLanding),
        label: tPartner("linkFromPlace", { partner: PARTNER_NAME, place: placeLabel, count }),
      });
    }
  }
  if (links.length === 0) return null;

  return (
    <ul className="mt-1.5 pl-7 flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="tap-zone relative text-primary underline-offset-2 hover:underline"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
