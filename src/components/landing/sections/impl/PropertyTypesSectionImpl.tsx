import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import type { PropertiesDealParam } from "@/lib/catalog/propertiesDealFromLanding";
import type { PropertyTypeCard } from "@/lib/sanity/propertyTypeAdapter";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { canonicalCatalogUrl } from "@/lib/routes/catalog";
import { SectionHeader, SectionCtaLink } from "@/components/landing/sectionPrimitives";

export type PropertyTypesData = {
  title?: string;
  subtitle?: string;
  shortLine?: string;
  ctaLabel?: string;
  ctaHref?: string;
  propertyTypes: PropertyTypeCard[];
} | null;

function buildPropertiesListingHref(
  locale: string,
  typeSlug: string | undefined,
  propertiesDeal?: PropertiesDealParam
): string {
  return canonicalCatalogUrl({
    locale,
    propertyType: typeSlug,
    deal: propertiesDeal,
  });
}

const PropertyTypes: React.FC<{
  locale: string;
  propertyTypesData?: PropertyTypesData;
  propertiesDeal?: PropertiesDealParam;
}> = async ({ locale, propertyTypesData, propertiesDeal }) => {
  const title = propertyTypesData?.title;
  const subtitle = propertyTypesData?.subtitle;
  const shortLine = propertyTypesData?.shortLine;
  const ctaLabel = propertyTypesData?.ctaLabel;
  const ctaHref = propertyTypesData?.ctaHref;
  if (!title) return null

  const trimmedCta = typeof ctaHref === "string" ? ctaHref.trim() : "";
  const href = trimmedCta ? resolveLocaleHref(trimmedCta, locale) : null;

  const types = Array.isArray(propertyTypesData?.propertyTypes) ? propertyTypesData.propertyTypes : [];

  if (types.length === 0) {
    return null;
  }

  const getTypeLink = (type: PropertyTypeCard) =>
    buildPropertiesListingHref(locale, type.slug || undefined, propertiesDeal);

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-10">
            <SectionHeader
              variant="left"
              eyebrowText={shortLine}
              title={title}
              subtitle={subtitle}
              eyebrowRowClassName="gap-2.5"
              titleClassName="lg:text-52 text-40 font-medium text-dark dark:text-white mt-4 mb-2 leading-[1.2]"
              subtitleClassName="text-base text-dark/50 dark:text-white/50 whitespace-pre-line"
            />
            {ctaLabel && href ? (
              <SectionCtaLink href={href} label={ctaLabel} />
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-5 md:gap-10">
            {types.map((type, index) => (
              <div
                key={type._id ?? (type.slug || `property-type-${index}`)}
                className="relative rounded-2xl overflow-hidden group focus-within:ring-2 focus-within:ring-primary/40"
              >
                <Link
                  href={getTypeLink(type)}
                  className="block"
                  aria-label={type.title}
                >
                  <div className="block relative w-full aspect-[320/386]">
                    {type.imageUrl ? (
                      <Image
                        src={type.imageUrl}
                        alt={type.imageAlt || type.title}
                        fill
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                        sizes="25vw"
                        unoptimized={!!type.imageUrl?.startsWith("http")}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-dark/10 dark:bg-white/10" />
                    )}
                  </div>
                  {/* Persistent base gradient for title legibility */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
                  />
                  {/* Always-visible title row at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 flex items-end justify-between gap-3 z-10">
                    <h3 className="text-white text-xl md:text-2xl font-medium leading-tight line-clamp-2">
                      {type.title}
                    </h3>
                    <span
                      aria-hidden
                      className="inline-flex shrink-0 h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-white text-dark transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-white"
                    >
                      <Icon icon="ph:arrow-right" width={18} height={18} />
                    </span>
                  </div>
                  {/* Hover reveal: full description overlay */}
                  {type.shortDescription ? (
                    <div
                      aria-hidden
                      className="absolute inset-0 z-20 flex flex-col justify-end p-5 md:p-6 bg-gradient-to-t from-black/85 via-black/60 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    >
                      <h3 className="text-white text-xl md:text-2xl font-medium leading-tight mb-2 line-clamp-2">
                        {type.title}
                      </h3>
                      <p className="text-white/85 text-sm md:text-base leading-6 whitespace-pre-line line-clamp-4">
                        {type.shortDescription}
                      </p>
                    </div>
                  ) : null}
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

