import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import { textLinkClass } from "@/components/catalog/depthUi";
import { fetchPartnerPlaceListings } from "@/lib/sanity/queries/partnerLandings";
import { PARTNER_LANDING_MIN_LISTINGS, PARTNER_NAME, partnerLandingForPlace, partnerLandingPath } from "@/lib/partnerLandings/config";
import { selectPartnerListings } from "@/lib/partnerLandings/facts";

type Props = {
  locale: string;
  citySlug: string;
  districtSlug?: string | null;
  /** The place's name in this locale, nominative. */
  placeLabel: string;
  className?: string;
};

/**
 * One link from a place's catalogue (and from the partner's own listings in
 * it) to the partner landing of that place — the crawler reaches the new
 * page from pages it already visits, and a buyer reading the district finds
 * the agency's selection. Nothing when the place has no landing or the
 * landing is below its index floor.
 */
export async function PartnerPlaceLandingLink({ locale, citySlug, districtSlug, placeLabel, className }: Props) {
  const landing = partnerLandingForPlace({ city: citySlug, district: districtSlug });
  if (!landing) return null;
  const [rows, t] = await Promise.all([fetchPartnerPlaceListings(landing), getTranslations({ locale, namespace: "PartnerLanding" })]);
  const count = selectPartnerListings(rows, landing).length;
  if (count < PARTNER_LANDING_MIN_LISTINGS) return null;
  return (
    <Link href={partnerLandingPath(locale, landing)} className={className ?? textLinkClass}>
      {t("linkFromPlace", { partner: PARTNER_NAME, place: placeLabel, count })}
    </Link>
  );
}
