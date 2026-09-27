import { getTranslations } from "next-intl/server";
import { EntityCard } from "@/components/landing/sections/impl/EntityCard";
import { fetchPublishedDistrictsByCity } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { catalogFilterPath, cityInfoPath, districtInfoPath } from "@/lib/routes/catalog";
import { brandButtonClass } from "@/components/shared/BrandButton";

type Props = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  cityLabel: string;
  districtSlug: string;
  districtLabel: string;
};

/**
 * Internal-linking block at the bottom of a district page:
 * catalog URL filtered by this district, the city editorial page, and 2–3 sibling districts.
 */
export async function DistrictExploreSection({
  locale,
  countrySlug,
  citySlug,
  cityLabel,
  districtSlug,
  districtLabel,
}: Props) {
  const t = await getTranslations("Districts");
  const siblings = (await fetchPublishedDistrictsByCity(citySlug))
    .filter((d) => d.slug !== districtSlug)
    .slice(0, 3);

  const propertiesHref = catalogFilterPath({
    locale,
    country: countrySlug,
    trustedCityCountrySlug: countrySlug,
    city: citySlug,
    district: districtSlug,
  });
  const cityInfoHref = cityInfoPath(locale, citySlug, countrySlug);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <h2 className="lg:text-52 text-40 leading-[1.2] font-medium text-dark dark:text-white">
          {t("exploreTitle")}
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={propertiesHref}
            className={brandButtonClass("primary", undefined, "md")}
          >
            {t("propertiesInDistrict", { district: districtLabel })}
          </a>
          <a
            href={cityInfoHref}
            className={brandButtonClass("secondary", undefined, "md")}
          >
            {t("aboutCity", { city: cityLabel })}
          </a>
        </div>

        {siblings.length > 0 ? (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-dark dark:text-white">
              {t("otherDistricts", { city: cityLabel })}
            </h3>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {siblings.map((d) => {
                const title =
                  resolveLocalizedString(d.title as never, locale) || d.slug || "";
                return (
                  <EntityCard
                    key={d._id ?? d.slug}
                    href={districtInfoPath(locale, citySlug, d.slug!, countrySlug)}
                    title={title}
                    imageUrl={d.heroImage?.asset?.url}
                    imageAlt={d.heroImage?.alt || title}
                    shortDescription={
                      resolveLocalizedString(d.shortDescription as never, locale) || undefined
                    }
                    count={d.propertiesCount}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
