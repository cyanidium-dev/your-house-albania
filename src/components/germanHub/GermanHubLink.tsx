import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import { textLinkClass } from "@/components/catalog/depthUi";
import { GERMAN_HUB_LOCALE, germanHubPath } from "@/lib/germanHub/config";

/**
 * The one line under the `/de/sale` hero that sends a German visitor to the
 * market hub (`/de/albanien-immobilien`): the catalogue is where the German
 * queries land ("albanien immobilien am meer kaufen", 360 impressions and one
 * click in the quarter to 2026-10-18), the hub is where they are answered.
 * Renders nothing in any other locale.
 */
export async function GermanHubLink({ locale, className }: { locale: string; className?: string }) {
  if (locale !== GERMAN_HUB_LOCALE) return null;
  const t = await getTranslations({ locale, namespace: "GermanHub" });
  return (
    <Link href={germanHubPath()} className={className ?? `${textLinkClass} !text-white`}>
      {t("linkFromSale")}
    </Link>
  );
}
