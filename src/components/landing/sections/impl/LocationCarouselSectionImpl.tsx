import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import type { CityCard, LocationCarouselCard } from "@/lib/sanity/cityAdapter";
import { CitiesCarouselClient } from "./CitiesCarouselClient";

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
        ? `/${locale}/cities/${c.slug}`
        : `/${locale}/properties?city=${c.slug}`,
    })),
  } : null);

  const title = data?.title;
  const description = data?.subtitle ?? data?.shortLine;
  const ctaLabel = data?.ctaLabel;
  const ctaHref = data?.ctaHref;
  const href = ctaHref
    ? ctaHref.startsWith("/")
      ? `/${locale}${ctaHref}`
      : `/${locale}/${ctaHref}`
    : null;

  const cards = data?.locationCards ?? [];
  if (cards.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <div className="absolute left-0 top-0">
        <Image
          src="/images/categories/Vector.svg"
          alt="vector"
          width={800}
          height={1050}
          className="dark:hidden"
          unoptimized={true}
        />
        <Image
          src="/images/categories/Vector-dark.svg"
          alt="vector"
          width={800}
          height={1050}
          className="hidden dark:block"
          unoptimized={true}
        />
      </div>
      <div className="container max-w-8xl mx-auto min-w-0 px-5 2xl:px-0 relative z-10">
        <div className="flex flex-col gap-10 min-w-0">
          <div className="min-w-0">
            <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2.5 min-w-0">
              <Icon
                icon="ph:house-simple-fill"
                className="text-2xl text-primary shrink-0"
              />
              {BADGE}
            </p>
            {title ? (
              <h2 className="text-2xl sm:text-3xl lg:text-40 xl:text-52 mt-4 mb-2 font-medium leading-[1.2] text-dark dark:text-white break-words min-w-0">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-dark/50 dark:text-white/50 text-lg lg:max-w-full leading-[1.3] md:max-w-3/4 min-w-0">
                {description}
              </p>
            ) : null}
            {ctaLabel && href ? (
              <Link
                href={href}
                className="py-4 px-8 bg-primary text-base leading-4 block w-fit text-white rounded-full font-semibold mt-8 hover:bg-dark duration-300"
              >
                {ctaLabel}
              </Link>
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
