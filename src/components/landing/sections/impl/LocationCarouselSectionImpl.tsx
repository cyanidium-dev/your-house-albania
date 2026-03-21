import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import type { CityCard } from "@/lib/sanity/cityAdapter";

export type CitiesData = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  linkTargetType?: "catalog" | "landing";
  cities: CityCard[];
} | null;

const Cities: React.FC<{ locale: string; citiesData?: CitiesData }> = async ({
  locale,
  citiesData,
}) => {
  const badge = "Cities";
  const title = citiesData?.title;
  const description = citiesData?.subtitle;
  const ctaLabel = citiesData?.ctaLabel;
  const ctaHref = citiesData?.ctaHref;
  const href = ctaHref
    ? ctaHref.startsWith("/")
      ? `/${locale}${ctaHref}`
      : `/${locale}/${ctaHref}`
    : null;

  const cities = Array.isArray(citiesData?.cities) ? citiesData.cities : [];
  const linkTargetType = citiesData?.linkTargetType;
  const [big1, big2, small1, small2] = cities;

  const toCardHref = (citySlug?: string) => {
    if (!citySlug) return `/${locale}/properties`;
    if (linkTargetType === "landing") return `/${locale}/cities/${citySlug}`;
    return `/${locale}/properties?city=${citySlug}`;
  };

  const renderCard = (
    city: CityCard,
    size: "big" | "small",
    linkPath: string,
  ) => (
    <div
      key={city._id ?? city.slug}
      className={
        size === "big"
          ? "lg:col-span-6 col-span-12"
          : "lg:col-span-3 col-span-6"
      }
    >
      <div className="relative rounded-2xl overflow-hidden group">
        <Link
          href={linkPath}
          className={`block relative w-full ${size === "big" ? "aspect-[680/386]" : "aspect-[320/386]"}`}
        >
          {city.heroImageUrl ? (
            <Image
              src={city.heroImageUrl}
              alt={city.title}
              fill
              className="object-cover object-center"
              sizes={
                size === "big"
                  ? "(max-width: 1024px) 100vw, 50vw"
                  : "(max-width: 1024px) 50vw, 25vw"
              }
              unoptimized={!!city.heroImageUrl?.startsWith("http")}
            />
          ) : (
            <div className="absolute inset-0 bg-dark/10 dark:bg-white/10" />
          )}
        </Link>
        <Link
          href={linkPath}
          className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between pl-10 pb-10 group-hover:top-0 duration-500"
        >
          <div className="flex justify-end mt-6 mr-6">
            <div className="bg-white text-dark rounded-full w-fit p-4">
              <Icon icon="ph:arrow-right" width={24} height={24} />
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 className="text-white text-2xl">{city.title}</h3>
            <p className="text-white/80 text-base leading-6">
              {city.shortDescription || ""}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );

  if (cities.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
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
        <div className="grid grid-cols-12 items-center gap-10 min-w-0">
          <div className="lg:col-span-6 col-span-12 min-w-0">
            <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2.5 min-w-0">
              <Icon
                icon="ph:house-simple-fill"
                className="text-2xl text-primary shrink-0"
              />
              {badge}
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
          {big1 &&
            renderCard(big1, "big", toCardHref(big1.slug))}
          {big2 &&
            renderCard(big2, "big", toCardHref(big2.slug))}
          {small1 &&
            renderCard(
              small1,
              "small",
              toCardHref(small1.slug),
            )}
          {small2 &&
            renderCard(
              small2,
              "small",
              toCardHref(small2.slug),
            )}
        </div>
      </div>
    </section>
  );
};

export default Cities;

