import Image from "next/image";
import { SectionHeader, SectionCtaLink } from "@/components/landing/sectionPrimitives";
import type { CityCard, LocationCarouselCard } from "@/lib/sanity/cityAdapter";
import { resolveCta } from "@/lib/routes/resolveLocaleHref";
import { EntityCard } from "./EntityCard";
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
  const cta = resolveCta(data?.ctaLabel, data?.ctaHref, locale);

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
              titleClassName="text-3xl sm:text-4xl lg:text-40 xl:text-52 mt-4 mb-2 font-medium leading-[1.2] text-dark dark:text-white break-words min-w-0"
              subtitleClassName="text-lg lg:max-w-full leading-[1.3] md:max-w-3/4 min-w-0"
            />
            {cta ? (
              <div className="mt-8">
                <SectionCtaLink href={cta.href} label={cta.label} />
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {cards.map((card) => (
              <EntityCard
                key={card._id ?? card.slug}
                href={card.href}
                title={card.title}
                imageUrl={card.heroImageUrl}
                shortDescription={card.shortDescription}
                tag={card.vibe}
                count={card.propertiesCount}
                countLabel="properties"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cities;
