import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import type { PropertyTypeCard } from "@/lib/sanity/propertyTypeAdapter";

export type PropertyTypesData = {
  title?: string;
  subtitle?: string;
  shortLine?: string;
  ctaLabel?: string;
  ctaHref?: string;
  propertyTypes: PropertyTypeCard[];
} | null;

const PropertyTypes: React.FC<{ locale: string; propertyTypesData?: PropertyTypesData }> = async ({
  locale,
  propertyTypesData,
}) => {
  const title = propertyTypesData?.title;
  const subtitle = propertyTypesData?.subtitle;
  const shortLine = propertyTypesData?.shortLine;
  const ctaLabel = propertyTypesData?.ctaLabel;
  const ctaHref = propertyTypesData?.ctaHref;
  if (!title) return null

  const href = ctaHref
    ? ctaHref.startsWith("/") ? `/${locale}${ctaHref}` : `/${locale}/${ctaHref}`
    : null;

  const types = Array.isArray(propertyTypesData?.propertyTypes) ? propertyTypesData.propertyTypes : [];

  if (types.length === 0) {
    return null;
  }

  const getTypeLink = (type: PropertyTypeCard) => {
    if (type.slug) return `/${locale}/properties?type=${type.slug}`;
    return `/${locale}/properties`;
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2 items-center">
                <Icon icon="ph:house-simple-fill" className="text-2xl text-primary shrink-0" />
                {shortLine ? <span>{shortLine}</span> : null}
              </p>
              <h2 className="lg:text-52 text-40 font-medium text-dark dark:text-white mt-4 mb-2">
                {title}
              </h2>
              {subtitle ? <p className="text-base text-dark/50 dark:text-white/50">{subtitle}</p> : null}
            </div>
            {ctaLabel && href ? (
              <Link
                href={href}
                className="py-4 px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white w-fit"
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-10">
            {types.map((type, index) => (
              <div
                key={type._id ?? type.slug || `property-type-${index}`}
                className="relative rounded-2xl overflow-hidden group"
              >
                <Link href={getTypeLink(type)}>
                  <div className="block relative w-full aspect-[320/386]">
                    {type.imageUrl ? (
                      <Image
                        src={type.imageUrl}
                        alt={type.imageAlt || type.title}
                        fill
                        className="object-cover object-center"
                        sizes="25vw"
                        unoptimized={!!type.imageUrl?.startsWith("http")}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-dark/10 dark:bg-white/10" />
                    )}
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

