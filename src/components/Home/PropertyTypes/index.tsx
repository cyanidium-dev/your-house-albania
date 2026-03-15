import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { PropertyTypeCard } from "@/lib/sanity/propertyTypeAdapter";

export type PropertyTypesData = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  propertyTypes: PropertyTypeCard[];
} | null;

const PropertyTypes: React.FC<{ locale: string; propertyTypesData?: PropertyTypesData }> = async ({
  locale,
  propertyTypesData,
}) => {
  const t = await getTranslations("Home.services");
  const badge = "Property types";
  const title = propertyTypesData?.title ?? t("title");
  const subtitle = propertyTypesData?.subtitle ?? t("description");
  const ctaLabel = propertyTypesData?.ctaLabel ?? t("viewProperties");
  const ctaHref = propertyTypesData?.ctaHref ?? "/properties";
  const href = ctaHref.startsWith("/") ? `/${locale}${ctaHref}` : `/${locale}/${ctaHref}`;

  const types = Array.isArray(propertyTypesData?.propertyTypes) ? propertyTypesData.propertyTypes : [];

  if (types.length === 0) {
    return null;
  }

  const getTypeLink = (type: PropertyTypeCard) => {
    if (type.slug) return `/${locale}/properties?type=${type.slug}`;
    return `/${locale}/properties`;
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
                <Icon icon="ph:house-simple-fill" className="text-2xl text-primary " />
                {badge}
              </p>
              <h2 className="lg:text-52 text-40 font-medium text-dark dark:text-white mt-4 mb-2">
                {title}
              </h2>
              <p className="text-base text-dark/50 dark:text-white/50">
                {subtitle}
              </p>
            </div>
            <Link
              href={href}
              className="py-4 px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white w-fit"
            >
              {ctaLabel}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-10">
            {types.map((type) => (
              <div
                key={type._id ?? type.title}
                className="relative rounded-2xl overflow-hidden group"
              >
                <Link href={getTypeLink(type)}>
                  <div className="block relative w-full aspect-[320/386]">
                    <Image
                      src={type.imageUrl || "/images/categories/villas.jpg"}
                      alt={type.imageAlt || type.title}
                      fill
                      className="object-cover object-center"
                      sizes="25vw"
                      unoptimized={!!type.imageUrl?.startsWith("http")}
                    />
                  </div>
                </Link>
                <Link
                  href={getTypeLink(type)}
                  className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between pl-10 pb-10 group-hover:top-0 duration-500 inset-0"
                >
                  <div className="flex justify-end mt-6 mr-6">
                    <div className="bg-white text-dark rounded-full w-fit p-4">
                      <Icon icon="ph:arrow-right" width={24} height={24} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-white text-2xl">{type.title}</h3>
                    <p className="text-white/80 text-base leading-6">
                      {type.shortDescription || ""}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyTypes;
