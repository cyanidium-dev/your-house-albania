import Image from "next/image";
import { SectionHeader, SectionCtaLink } from "@/components/landing/sectionPrimitives";
import type { CityCard, LocationCarouselCard } from "@/lib/sanity/cityAdapter";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { CitiesCarouselClient } from "./CitiesCarouselClient";
import { catalogFilterPath, cityInfoPath } from "@/lib/routes/catalog";

export type CitiesData = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  linkTargetType?: "catalog" | "landing";
  cities: CityCard[];
} | null;

export type LocationData = {
  title?: string;
  subtitle?: string;
  shortLine?: string;
  ctaLabel?: string;
  ctaHref?: string;
  locationCards: LocationCarouselCard[];
} | null;

const BADGE = "Cities";

const Cities: React.FC<{
  locale: string;
  citiesData?: CitiesData;
  locationData?: LocationData;
}> = async ({ locale, citiesData, locationData }) => {
  const data = locationData ?? (citiesData ? {
    title: citiesData.title,
    subtitle: citiesData.subtitle,
    shortLine: undefined,
    ctaLabel: citiesData.ctaLabel,
    ctaHref: citiesData.ctaHref,
    locationCards: (citiesData.cities ?? []).map((c) => ({
      ...c,
      href: citiesData.linkTargetType === "landing"
        ? cityInfoPath(locale, c.slug, c.countrySlug)
        : catalogFilterPath({ locale, city: c.slug, country: c.countrySlug }),
    })),
  } : null);

  const title = data?.title;
  const description = data?.subtitle ?? data?.shortLine;
  const ctaLabel = data?.ctaLabel;
  const ctaHref = data?.ctaHref;
  const href = ctaHref ? resolveLocaleHref(ctaHref, locale) : null;

  const cards = data?.locationCards ?? [];
  if (cards.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute left-0 top-0" aria-hidden>
        <Image
          src="/images/categories/Vector.svg"
          alt=""
          width={800}
          height={1050}
          className="dark:hidden"
          unoptimized={true}
        />
        <Image
          src="/images/categories/Vector-dark.svg"
          alt=""
          width={800}
          height={1050}
          className="hidden dark:block"
          unoptimized={true}
        />
      </div>
      <div className="container max-w-8xl mx-auto min-w-0 px-5 2xl:px-0 relative z-10">
        <div className="flex flex-col gap-10 min-w-0">
          <div className="min-w-0">
            <SectionHeader
              variant="left"
              eyebrowText={BADGE}
              title={title}
              subtitle={description}
              eyebrowRowClassName="gap-2.5"
              titleClassName="text-2xl sm:text-3xl lg:text-40 xl:text-52 mt-4 mb-2 font-medium leading-[1.2] text-dark dark:text-white break-words min-w-0"
              subtitleClassName="text-lg lg:max-w-full leading-[1.3] md:max-w-3/4 min-w-0"
            />
            {ctaLabel && href ? (
              <div className="mt-8">
                <SectionCtaLink href={href} label={ctaLabel} />
              </div>
            ) : null}
          </div>
          <div className="relative -mx-4 px-4 lg:-mx-12 lg:px-12">
            <CitiesCarouselClient cards={cards} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cities;
