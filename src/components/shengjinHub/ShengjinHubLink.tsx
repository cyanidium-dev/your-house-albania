import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import { textLinkClass } from "@/components/catalog/depthUi";
import { SHENGJIN_CITY, shengjinHubPath } from "@/lib/shengjinHub/config";

/**
 * One line that sends a visitor of a Shëngjin page to the hub
 * (`/{locale}/shengjin`): prices against the other seaside cities, the
 * cheapest flats by the sea, the buying costs. Renders nothing for another
 * city, so it can sit on any place-bound surface.
 */
export async function ShengjinHubLink({
  locale,
  citySlug,
  className,
}: {
  locale: string;
  citySlug?: string | null;
  className?: string;
}) {
  if ((citySlug ?? "").trim().toLowerCase() !== SHENGJIN_CITY) return null;
  const t = await getTranslations({ locale, namespace: "ShengjinHub" });
  return (
    <Link href={shengjinHubPath(locale)} className={className ?? textLinkClass}>
      {t("linkFromListing")}
    </Link>
  );
}
