import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/**
 * `/properties` was the catalogue path of an early build. CMS CTAs on most
 * district and five city documents still point there (`heroCta`,
 * `allPropertiesCta`), and without a route they were 404s — every Himarë
 * district page linked one. The data is being corrected; this keeps any copy
 * that still carries the old path landing on the sale listing.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  permanentRedirect(`/${locale}/sale`);
}
