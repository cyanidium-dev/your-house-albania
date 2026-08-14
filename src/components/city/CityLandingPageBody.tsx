import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { CityLandingBreadcrumb } from "@/components/shared/CityLandingBreadcrumb";
import { CityDistrictsHubLink } from "@/components/city/CityDistrictsHubLink";
import { asSections } from "@/components/landing/sectionRenderers/helpers";
import { fetchCityLandingByCitySlug } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { formatBreadcrumbSlug } from "@/lib/routes/breadcrumbs";

type Props = {
  locale: string;
  citySlug: string;
};

/**
 * Shared server-rendered city editorial landing (CMS `landingPage` + city).
 * Used by `/[locale]/[country]/[city]/info` (canonical) and legacy redirects.
 */
export async function CityLandingPageBody({ locale, citySlug }: Props) {
  const landing = await fetchCityLandingByCitySlug(citySlug);
  if (!landing) notFound();

  const sections = asSections(landing as never);
  const hasDedicatedHero = sections[0]?._type === "heroSection";

  const cityTitle = (landing as { linkedCity?: { title?: unknown } }).linkedCity?.title;
  const cityLabel =
    resolveLocalizedString(cityTitle as never, locale) || formatBreadcrumbSlug(citySlug);
  const districtsHubLink = (
    <CityDistrictsHubLink locale={locale} citySlug={citySlug} cityLabel={cityLabel} />
  );

  if (hasDedicatedHero) {
    return (
      <>
        <LandingRenderer
          locale={locale}
          landing={landing as never}
          citySlug={citySlug}
          breadcrumb={<CityLandingBreadcrumb locale={locale} city={citySlug} overHero />}
        />
        {districtsHubLink}
      </>
    );
  }

  return (
    <>
      <section className="pt-20 md:pt-32">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <CityLandingBreadcrumb locale={locale} city={citySlug} />
        </div>
      </section>
      <LandingRenderer locale={locale} landing={landing as never} citySlug={citySlug} />
      {districtsHubLink}
    </>
  );
}
