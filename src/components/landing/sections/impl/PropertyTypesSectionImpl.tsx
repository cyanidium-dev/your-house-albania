import type { PropertiesDealParam } from "@/lib/catalog/propertiesDealFromLanding";
import type { PropertyTypeCard } from "@/lib/sanity/propertyTypeAdapter";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { canonicalCatalogUrl } from "@/lib/routes/catalog";
import { dealRouteSegmentToQueryValue } from "@/lib/routes/catalogPathPrimitives";
import { isPublicDealQuery } from "@/lib/catalog/publicDealTypes";
import { SectionHeader, SectionCtaLink } from "@/components/landing/sectionPrimitives";
import { Section, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from "@/components/shared/layout";
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

  const types = (
    Array.isArray(propertyTypesData?.propertyTypes) ? propertyTypesData.propertyTypes : []
  ).filter((type) => {
    // Some "property types" are really rental deals (slug === a deal route
    // segment, e.g. `short-term-rent`). Drop those while rentals are hidden.
    const dealQuery = dealRouteSegmentToQueryValue(type.slug || undefined);
    return dealQuery === "" || isPublicDealQuery(dealQuery);
  });

  if (types.length === 0) return null;

  return (
    <Section>
        <div className={SPLIT}>
          <div className={`${SPLIT_ASIDE} flex flex-col gap-10`}>
            <SectionHeader
              variant="left"
              eyebrowText={shortLine}
              title={title}
              subtitle={subtitle}
              eyebrowRowClassName="gap-2.5"
              titleClassName="mt-4 break-words"
            />
            {ctaLabel && href ? (
              <SectionCtaLink href={href} label={ctaLabel} />
            ) : null}
          </div>
          {/* Three types in two columns left the third alone on a row. */}
          <div
            className={`${SPLIT_MAIN} grid gap-3 sm:gap-5 md:gap-6 ${
              types.length % 3 === 0 && types.length % 2 !== 0 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"
            }`}
          >
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
    </Section>
  );
};

export default PropertyTypes;
