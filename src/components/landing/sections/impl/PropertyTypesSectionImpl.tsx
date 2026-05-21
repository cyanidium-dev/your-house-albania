import type { PropertiesDealParam } from "@/lib/catalog/propertiesDealFromLanding";
import type { PropertyTypeCard } from "@/lib/sanity/propertyTypeAdapter";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { canonicalCatalogUrl } from "@/lib/routes/catalog";
import { SectionHeader, SectionCtaLink } from "@/components/landing/sectionPrimitives";
import { EntityCard } from "./EntityCard";

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
  if (!title) return null;

  const trimmedCta = typeof ctaHref === "string" ? ctaHref.trim() : "";
  const href = trimmedCta ? resolveLocaleHref(trimmedCta, locale) : null;

  const types = Array.isArray(propertyTypesData?.propertyTypes)
    ? propertyTypesData.propertyTypes
    : [];

  if (types.length === 0) return null;

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
              titleClassName="text-3xl sm:text-4xl lg:text-40 xl:text-52 mt-4 mb-2 font-medium leading-[1.2] text-dark dark:text-white"
              subtitleClassName="text-base text-dark/50 dark:text-white/50 whitespace-pre-line"
            />
            {ctaLabel && href ? (
              <SectionCtaLink href={href} label={ctaLabel} />
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6">
            {types.map((type, index) => (
              <EntityCard
                key={type._id ?? (type.slug || `property-type-${index}`)}
                href={buildPropertiesListingHref(locale, type.slug || undefined, propertiesDeal)}
                title={type.title}
                imageUrl={type.imageUrl}
                imageAlt={type.imageAlt}
                shortDescription={type.shortDescription}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyTypes;
