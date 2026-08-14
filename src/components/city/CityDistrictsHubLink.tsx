import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  fetchCityCountrySlugByCitySlug,
  fetchPublishedDistrictsByCity,
} from "@/lib/sanity/client";
import { districtsHubPath } from "@/lib/routes/catalog";

type Props = {
  locale: string;
  citySlug: string;
  cityLabel: string;
};

/**
 * Internal-linking block on the city editorial page (`/{country}/{city}/info`):
 * one link to the districts hub `/{country}/{city}/districts`.
 * Renders nothing when the city has no published districts (the hub 404s then).
 */
export async function CityDistrictsHubLink({ locale, citySlug, cityLabel }: Props) {
  const [districts, countrySlug, t] = await Promise.all([
    fetchPublishedDistrictsByCity(citySlug),
    fetchCityCountrySlugByCitySlug(citySlug),
    getTranslations("Districts"),
  ]);
  if (districts.length === 0) return null;

  return (
    <section className="pb-16 md:pb-24">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <div className="rounded-2xl border border-dark/10 dark:border-white/10 p-8 md:p-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-medium text-dark dark:text-white">
              {t("hubTitle", { city: cityLabel })}
            </h2>
            <p className="mt-2 text-xm text-dark/50 dark:text-white/50">
              {t("hubDescription", { city: cityLabel })}
            </p>
          </div>
          <Link
            href={districtsHubPath(locale, citySlug, countrySlug)}
            className="shrink-0 inline-flex items-center justify-center py-4 px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white font-semibold text-sm"
          >
            {t("viewAllDistricts", { city: cityLabel })}
          </Link>
        </div>
      </div>
    </section>
  );
}
