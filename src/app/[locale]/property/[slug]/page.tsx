import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { fetchPropertyBySlug, fetchSiteSettings, fetchSimilarPropertyCandidates } from '@/lib/sanity/client';
import { mapSanityPropertyToDetailsFields, mapSanityPropertyGallery, mapCatalogPropertyToCard, mapPropertyAmenityDisplayItems, mapSanityPropertyOffers, resolvePropertyIconKey } from '@/lib/sanity/propertyAdapter';
import { buildPropertyMetadata } from '@/lib/sanity/propertySeoAdapter';
import { Icon } from '@iconify/react';
import { PropertyLocationMap } from '@/components/catalog/map/PropertyLocationMap';
import Link from 'next/link';
import Image from 'next/image';
import { PropertyGallery } from '@/components/Properties/PropertyGallery';
import { PropertyDetailBreadcrumb } from '@/components/shared/PropertyDetailBreadcrumb';
import { PropertyJsonLd } from '@/components/shared/PropertyJsonLd';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { getBaseUrl } from '@/lib/seo/baseUrl';
import { PriceText } from '@/components/shared/PriceText';
import { PropertyAmenitiesSection } from '@/components/property/PropertyAmenitiesSection';
import { SimilarPropertiesCarousel } from '@/components/property/SimilarPropertiesCarousel';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  if (!slug || typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
    notFound();
  }

  const [sanityProperty, siteSettings] = await Promise.all([
    fetchPropertyBySlug(slug),
    fetchSiteSettings(),
  ]);

  if (!sanityProperty) {
    return {};
  }

  const fields = mapSanityPropertyToDetailsFields(
    sanityProperty as never,
    locale,
  );

  const propertySeo = (sanityProperty as { seo?: unknown })?.seo;
  const defaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo as
    | {
        metaTitle?: Record<string, string>;
        metaDescription?: Record<string, string>;
      }
    | undefined;

  const itemTitle = fields.title || slug;
  const itemDescription = fields.description?.trim() || undefined;

  const coverImageUrl = (sanityProperty as { gallery?: Array<{ asset?: { url?: string } }> })?.gallery?.[0]?.asset?.url;

  return buildPropertyMetadata(
    propertySeo as never,
    defaultSeo as never,
    locale,
    {
      itemTitle,
      itemDescription,
      coverImageUrl: coverImageUrl ?? undefined,
    }
  );
}

function getSimilarCount(settings: unknown): number {
  const raw = (settings as { similarPropertiesCount?: unknown })?.similarPropertiesCount;
  const n = typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 8;
  return Math.min(n, 24);
}

export default async function PropertyDetailsPage({ params }: Props) {
  const { slug, locale } = await params;
  if (!slug || typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
    notFound();
  }

  const [sanityProperty, siteSettings] = await Promise.all([
    fetchPropertyBySlug(slug),
    fetchSiteSettings(),
  ]);
  if (sanityProperty == null) {
    notFound();
  }

  const similarCount = getSimilarCount(siteSettings);
  const citySlug = (sanityProperty as { city?: { slug?: string } })?.city?.slug;
  const similarCandidates = await fetchSimilarPropertyCandidates(
    (sanityProperty as { _id: string })._id,
    citySlug ?? null,
    similarCount
  );
  const similarItems = similarCandidates.map((c) => mapCatalogPropertyToCard(c, locale));

  const sanityFields = mapSanityPropertyToDetailsFields(sanityProperty as never, locale);
  const galleryImages = mapSanityPropertyGallery(sanityProperty as never);

  const title = sanityFields.title;
  const location = sanityFields.location;
  const beds = sanityFields.beds;
  const baths = sanityFields.baths;
  const area = sanityFields.area;

  const descriptionParas = sanityFields.description
    ? sanityFields.description.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  const sanityWithCoords = sanityProperty as {
    coordinates?: { lat?: number; lng?: number } | null;
    coordinatesLat?: number | null;
    coordinatesLng?: number | null;
  };
  const resolvedCoordinates = (() => {
    const coord = sanityWithCoords?.coordinates;
    if (coord != null && typeof coord.lat === 'number' && typeof coord.lng === 'number' && Number.isFinite(coord.lat) && Number.isFinite(coord.lng)) {
      return { lat: coord.lat, lng: coord.lng };
    }
    const lat = sanityWithCoords?.coordinatesLat;
    const lng = sanityWithCoords?.coordinatesLng;
    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return null;
  })();
  const districtSlug = (sanityProperty as { district?: { slug?: string } })?.district?.slug;

  const rawProperty = sanityProperty as {
    price?: number;
    currency?: string;
    status?: string;
  };
  const baseUrl = await getBaseUrl();
  const imageUrls = galleryImages.map((img) => img.url);

  const t = await getTranslations('Shared.propertyCard');
  const tPropertyDetail = await getTranslations('Shared.propertyDetail');
  const amenities = mapPropertyAmenityDisplayItems(sanityProperty as never, locale);
  const propertyOffers = mapSanityPropertyOffers(sanityProperty as never, locale);

  const dealTypeKey = (() => {
    const s = (rawProperty.status ?? '').toLowerCase();
    if (s === 'sale') return 'dealTypeSale';
    if (s === 'rent') return 'dealTypeRent';
    if (s === 'short-term' || s === 'shortterm') return 'dealTypeShortTerm';
    if (s === 'long-term' || s === 'longterm') return 'dealTypeLongTerm';
    return 'dealTypePrice';
  })();
  const dealTypeLabel = tPropertyDetail(dealTypeKey);

  return (
        <section className="pt-20 md:pt-32 pb-24 lg:pb-20 relative">
            <PropertyJsonLd
              name={title}
              slug={slug}
              description={sanityFields.description || null}
              location={location || null}
              price={rawProperty.price ?? null}
              currency={rawProperty.currency ?? null}
              status={rawProperty.status ?? null}
              beds={beds}
              baths={baths}
              area={area}
              imageUrls={imageUrls}
              baseUrl={baseUrl}
              locale={locale}
            />
            <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
                <PropertyDetailBreadcrumb
                  locale={locale}
                  propertyTitle={title}
                  propertySlug={slug}
                  citySlug={citySlug}
                  districtSlug={districtSlug}
                />
                <div className="grid grid-cols-12 items-end gap-6">
                    <div className="lg:col-span-8 col-span-12">
                        <h1 className='lg:text-52 text-40 font-semibold text-dark dark:text-white'>{title}</h1>
                        <div className="flex gap-2.5">
                            <Icon icon="ph:map-pin" width={24} height={24} className="text-dark/50 dark:text-white/50" />
                            <p className='text-dark/50 dark:text-white/50 text-xm'>{location}</p>
                        </div>
                    </div>
                    <div className="lg:col-span-4 col-span-12">
                        <div className='flex'>
                            <div className='flex flex-col gap-2 border-e border-black/10 dark:border-white/20 pr-2 xs:pr-4 mobile:pr-8'>
                                <Icon icon={'solar:bed-linear'} width={20} height={20} />
                                <p className='text-sm mobile:text-base font-normal text-black dark:text-white'>
                                    {t('bedroomsCount', { count: beds })}
                                </p>
                            </div>
                            <div className='flex flex-col gap-2 border-e border-black/10 dark:border-white/20 px-2 xs:px-4 mobile:px-8'>
                                <Icon icon={'solar:bath-linear'} width={20} height={20} />
                                <p className='text-sm mobile:text-base font-normal text-black dark:text-white'>
                                    {t('bathroomsCount', { count: baths })}
                                </p>
                            </div>
                            <div className='flex flex-col gap-2 pl-2 xs:pl-4 mobile:pl-8'>
                                <Icon
                                    icon={'lineicons:arrow-all-direction'}
                                    width={20}
                                    height={20}
                                />
                                <p className='text-sm mobile:text-base font-normal text-black dark:text-white'>
                                    {area}{t('areaUnit')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <PropertyGallery images={galleryImages} />
                <div className="grid grid-cols-12 gap-8 mt-10 items-start">
                    <div className="lg:col-span-8 col-span-12">
                        {amenities.length > 0 && (
                        <PropertyAmenitiesSection
                          amenities={amenities}
                          sectionTitle={tPropertyDetail('propertyDetails')}
                          checkAllLabel={tPropertyDetail('checkAllAmenities')}
                        />
                        )}
                        <div className="flex flex-col gap-5">
                            {descriptionParas.map((para, i) => (
                              <p key={i} className='text-dark dark:text-white text-xm '>
                                {para}
                              </p>
                            ))}
                        </div>
                        {propertyOffers.length > 0 && (
                        <div className="py-8 mt-8 border-t border-dark/5 dark:border-white/15">
                            <h3 className='text-xl font-medium'>{tPropertyDetail('whatThisPropertyOffers')}</h3>
                            <div className="grid grid-cols-3 mt-5 gap-6">
                                {propertyOffers.map((item) => (
                                  <div key={item.key} className="flex items-center gap-2.5">
                                    {item.customIconUrl ? (
                                      <Image src={item.customIconUrl} width={24} height={24} alt={item.customIconAlt ?? ''} className="w-6 h-6 object-contain shrink-0" unoptimized={true} />
                                    ) : (
                                      <Icon icon={resolvePropertyIconKey(item.iconKey)} width={24} height={24} className="text-dark dark:text-white shrink-0" />
                                    )}
                                    <p className='text-base dark:text-white text-dark'>{item.title}</p>
                                  </div>
                                ))}
                            </div>
                        </div>
                        )}
                    </div>
                    <div className="lg:col-span-4 col-span-12 lg:sticky lg:top-30">
                        <div className="hidden lg:block bg-primary/10 p-8 rounded-2xl relative z-10 overflow-hidden">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h4 className='text-dark text-3xl font-medium dark:text-white'>
                                  <PriceText amountEur={rawProperty.price ?? null} locale={locale} />
                              </h4>
                              <FavoriteButton slug={slug} name={title} variant="inline" imageUrl={galleryImages[0]?.url ?? null} />
                            </div>
                            <p className='text-sm text-dark/50 dark:text-white'>{dealTypeLabel}</p>
                            <Link href="#" className='py-4 px-8 bg-primary text-white rounded-full w-full block text-center hover:bg-dark duration-300 text-base mt-8 hover:cursor-pointer'>
                                {tPropertyDetail('getInTouch')}
                            </Link>
                            <div className="absolute right-0 top-4 -z-[1]">
                                <Image src="/images/properties/vector.svg" width={400} height={500} alt="vector" unoptimized={true} />
                            </div>
                        </div>
                        <div className="mt-10">
                          <PropertyLocationMap
                            coordinates={resolvedCoordinates}
                            mapHeightClassName="h-[210px]"
                          />
                        </div>
                    </div>
                </div>
                {similarItems.length > 0 && (
                  <section className="mt-16 pt-12 border-t border-dark/10 dark:border-white/20">
                    <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
                      <h2 className="text-xl font-medium mb-6">{tPropertyDetail('similarProperties')}</h2>
                      <SimilarPropertiesCarousel items={similarItems} locale={locale} />
                    </div>
                  </section>
                )}
            </div>
            {/* Mobile-only sticky bottom bar: price + CTA */}
            <div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark border-t border-dark/10 dark:border-white/20"
            >
              <div className='flex items-center justify-between gap-4 px-5 py-4 bg-primary/50'
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
                <div className="min-w-0 flex-1">
                  <h4 className="text-dark dark:text-white text-xl font-semibold truncate">
                    <PriceText amountEur={rawProperty.price ?? null} locale={locale} />
                  </h4>
                  <p className="text-sm text-dark/50 dark:text-white/50 truncate">{dealTypeLabel}</p>
                </div>
                <Link
                  href="#"
                  className="shrink-0 py-3 px-6 bg-primary text-white rounded-full text-base font-semibold hover:bg-dark duration-300 transition-colors text-center whitespace-nowrap"
                >
                  {tPropertyDetail('getInTouch')}
                </Link>
              </div>
            </div>
        </section>
    );
}
