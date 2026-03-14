"use client";

import { PropertyHomes } from "@/types/properyHomes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FavoriteButton } from "@/components/shared/FavoriteButton";

type Props = { item: PropertyHomes; locale: string };

export function PropertyCardClient({ item, locale }: Props) {
  const { name, location, rate, beds, baths, area, slug, images } = item;
  const t = useTranslations("Shared.propertyCard");
  const mainImage = images[0]?.src;
  const href = `/${locale}/property/${slug}`;

  return (
    <div>
      <div className="relative rounded-2xl border border-dark/10 dark:border-white/10 group hover:shadow-3xl duration-300 dark:hover:shadow-white/20">
        <div className="overflow-hidden rounded-t-2xl">
          <div className="absolute top-6 left-6 z-10">
            <FavoriteButton slug={slug} name={name} variant="overlay" imageUrl={mainImage ?? null} />
          </div>
          <Link href={href}>
            {mainImage && (
              <Image
                src={mainImage}
                alt={name}
                width={440}
                height={300}
                className="w-full rounded-t-2xl group-hover:brightness-50 group-hover:scale-125 transition duration-300 delay-75"
                unoptimized={true}
              />
            )}
          </Link>
          <Link
            href={href}
            aria-label={`Open ${name}`}
            className="absolute top-6 right-6 p-4 bg-white dark:bg-dark rounded-full hidden group-hover:block z-10 cursor-pointer transition-colors duration-300 ease-out hover:bg-primary/10 dark:hover:bg-white/10"
          >
            <Icon
              icon="solar:arrow-right-linear"
              width={24}
              height={24}
              className="text-black dark:text-white transition-transform duration-200 ease-out rotate-0 group-hover:-rotate-45 pointer-events-none"
            />
          </Link>
        </div>
        <div className="p-6">
          <div className="flex flex-col mobile:flex-row gap-5 mobile:gap-0 justify-between mb-6">
            <div>
              <Link href={href}>
                <h3 className="text-xl font-medium text-black dark:text-white duration-300 group-hover:text-primary">
                  {name}
                </h3>
              </Link>
              <p className="text-base font-normal text-black/50 dark:text-white/50">{location}</p>
            </div>
            <div>
              <button className="text-base font-normal text-primary px-5 py-2 rounded-full bg-primary/10">
                ${rate}
              </button>
            </div>
          </div>
          <div className="flex">
            <div className="flex flex-col gap-2 border-e border-black/10 dark:border-white/20 pr-2 xs:pr-4 mobile:pr-8">
              <Icon icon="solar:bed-linear" width={20} height={20} />
              <p className="text-sm mobile:text-base font-normal text-black dark:text-white">
                {beds} {t("bedrooms")}
              </p>
            </div>
            <div className="flex flex-col gap-2 border-e border-black/10 dark:border-white/20 px-2 xs:px-4 mobile:px-8">
              <Icon icon="solar:bath-linear" width={20} height={20} />
              <p className="text-sm mobile:text-base font-normal text-black dark:text-white">
                {baths} {t("bathrooms")}
              </p>
            </div>
            <div className="flex flex-col gap-2 pl-2 xs:pl-4 mobile:pl-8">
              <Icon icon="lineicons:arrow-all-direction" width={20} height={20} />
              <p className="text-sm mobile:text-base font-normal text-black dark:text-white">
                {area}
                {t("areaUnit")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
