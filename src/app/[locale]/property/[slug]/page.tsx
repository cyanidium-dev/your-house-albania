import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { fetchPropertyBySlug, fetchSiteSettings, fetchSimilarPropertyCandidates } from '@/lib/sanity/client';
import { mapSanityPropertyToDetailsFields, mapSanityPropertyGallery, mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter';
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
import PropertyCard from '@/components/shared/property/PropertyCard';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;

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

  const defaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo as
    | {
        metaTitle?: Record<string, string>;
        metaDescription?: Record<string, string>;
      }
    | undefined;

  const resolveLocalizedString = (await import('@/lib/sanity/localized'))
    .resolveLocalizedString;

  const siteTitle =
    defaultSeo?.metaTitle &&
    resolveLocalizedString(defaultSeo.metaTitle as never, locale);
  const siteDescription =
    defaultSeo?.metaDescription &&
    resolveLocalizedString(defaultSeo.metaDescription as never, locale);

  const title = fields.title || slug;
  const description =
    fields.description ||
    siteDescription ||
    `Details for property ${title}`;

  const fullTitle = siteTitle ? `${title} | ${siteTitle}` : title;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
    },
  };
}

function getSimilarCount(settings: unknown): number {
  const raw = (settings as { similarPropertiesCount?: unknown })?.similarPropertiesCount;
  const n = typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 2;
  return Math.min(n, 24);
}

export default async function PropertyDetailsPage({ params }: Props) {
  const { slug, locale } = await params;

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
  const dealTypeLabel = sanityFields.dealTypeLabel;

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
  const hasCoordinates = resolvedCoordinates != null;
  const districtSlug = (sanityProperty as { district?: { slug?: string } })?.district?.slug;

  const rawProperty = sanityProperty as {
    price?: number;
    currency?: string;
    status?: string;
  };
  const baseUrl = await getBaseUrl();
  const imageUrls = galleryImages.map((img) => img.url);

  return (
        <section className="!pt-44 pb-20 relative" >
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
                                    {beds} Bedrooms
                                </p>
                            </div>
                            <div className='flex flex-col gap-2 border-e border-black/10 dark:border-white/20 px-2 xs:px-4 mobile:px-8'>
                                <Icon icon={'solar:bath-linear'} width={20} height={20} />
                                <p className='text-sm mobile:text-base font-normal text-black dark:text-white'>
                                    {baths} Bathrooms
                                </p>
                            </div>
                            <div className='flex flex-col gap-2 pl-2 xs:pl-4 mobile:pl-8'>
                                <Icon
                                    icon={'lineicons:arrow-all-direction'}
                                    width={20}
                                    height={20}
                                />
                                <p className='text-sm mobile:text-base font-normal text-black dark:text-white'>
                                    {area}m<sup>2</sup>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <PropertyGallery images={galleryImages} />
                <div className="grid grid-cols-12 gap-8 mt-10">
                    <div className="lg:col-span-8 col-span-12">
                        <h3 className='text-xl font-medium'>Property details</h3>
                        <div className="py-8 my-8 border-y border-dark/10 dark:border-white/20 flex flex-col gap-8">
                            <div className="flex items-center gap-6">
                                <div>
                                    <Image src="/images/SVGs/property-details.svg" width={400} height={500} alt="" className='w-8 h-8 dark:hidden' unoptimized={true} />
                                    <Image src="/images/SVGs/property-details-white.svg" width={400} height={500} alt="" className='w-8 h-8 dark:block hidden' unoptimized={true} />
                                </div>
                                <div>
                                    <h3 className='text-dark dark:text-white text-xm'>Property details</h3>
                                    <p className='text-base text-dark/50 dark:text-white/50'>
                                        One of the few homes in the area with a private pool.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div>
                                    <Image src="/images/SVGs/smart-home-access.svg" width={400} height={500} alt="" className='w-8 h-8 dark:hidden' unoptimized={true} />
                                    <Image src="/images/SVGs/smart-home-access-white.svg" width={400} height={500} alt="" className='w-8 h-8 dark:block hidden' unoptimized={true} />
                                </div>
                                <div>
                                    <h3 className='text-dark dark:text-white text-xm'>Smart home access</h3>
                                    <p className='text-base text-dark/50 dark:text-white/50'>
                                        Easily check yourself in with a modern keypad system.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div>
                                    <Image src="/images/SVGs/energyefficient.svg" width={400} height={500} alt="" className='w-8 h-8 dark:hidden' unoptimized={true} />
                                    <Image src="/images/SVGs/energyefficient-white.svg" width={400} height={500} alt="" className='w-8 h-8 dark:block hidden' unoptimized={true} />
                                </div>
                                <div>
                                    <h3 className='text-dark dark:text-white text-xm'>Energy efficient</h3>
                                    <p className='text-base text-dark/50 dark:text-white/50'>
                                        Built in 2025 with sustainable and smart-home features.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-5">
                            {descriptionParas.map((para, i) => (
                              <p key={i} className='text-dark dark:text-white text-xm '>
                                {para}
                              </p>
                            ))}
                        </div>
                        <div className="py-8 mt-8 border-t border-dark/5 dark:border-white/15">
                            <h3 className='text-xl font-medium'>What this property offers</h3>
                            <div className="grid grid-cols-3 mt-5 gap-6">
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="ph:aperture" width={24} height={24} className="text-dark dark:text-white" />
                                    <p className='text-base dark:text-white text-dark'>Smart Home Integration</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="ph:chart-pie-slice" width={24} height={24} className="text-dark dark:text-white" />
                                    <p className='text-base dark:text-white text-dark'>Spacious Living Areas</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="ph:television-simple" width={24} height={24} className="text-dark dark:text-white" />
                                    <p className='text-base dark:text-white text-dark'>Energy Efficiency</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="ph:sun" width={24} height={24} className="text-dark dark:text-white" />
                                    <p className='text-base dark:text-white text-dark'>Natural Light</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="ph:video-camera" width={24} height={24} className="text-dark dark:text-white" />
                                    <p className='text-base dark:text-white text-dark'>Security Systems</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="ph:cloud" width={24} height={24} className="text-dark dark:text-white" />
                                    <p className='text-base dark:text-white text-dark'>Outdoor Spaces</p>
                                </div>
                            </div>
                        </div>
                        {hasCoordinates && resolvedCoordinates && (() => {
                          const embedSrc = `https://www.google.com/maps?q=${resolvedCoordinates.lat},${resolvedCoordinates.lng}&z=15&output=embed`;
                          return (
                            <iframe src={embedSrc} width="1114" height="400" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-2xl w-full" />
                          );
                        })()}
                    </div>
                    <div className="lg:col-span-4 col-span-12">
                        <div className="bg-primary/10 p-8 rounded-2xl relative z-10 overflow-hidden">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h4 className='text-dark text-3xl font-medium dark:text-white'>
                                  <PriceText amountEur={rawProperty.price ?? null} locale={locale} />
                              </h4>
                              <FavoriteButton slug={slug} name={title} variant="inline" imageUrl={galleryImages[0]?.url ?? null} />
                            </div>
                            <p className='text-sm text-dark/50 dark:text-white'>{dealTypeLabel}</p>
                            <Link href="#" className='py-4 px-8 bg-primary text-white rounded-full w-full block text-center hover:bg-dark duration-300 text-base mt-8 hover:cursor-pointer'>
                                Get in touch
                            </Link>
                            <div className="absolute right-0 top-4 -z-[1]">
                                <Image src="/images/properties/vector.svg" width={400} height={500} alt="vector" unoptimized={true} />
                            </div>
                        </div>
                        <div className="mt-10">
                          <PropertyLocationMap
                            coordinates={resolvedCoordinates}
                            mapHeightClassName="h-[420px]"
                          />
                        </div>
                        {similarItems.length > 0 && (
                          <section className="mt-10">
                            <h2 className="text-xl font-medium mb-4">Similar Properties</h2>
                            <div className="flex flex-col gap-4">
                              {similarItems.map((item) => (
                                <PropertyCard key={item.slug} item={item} locale={locale} view="large" />
                              ))}
                            </div>
                          </section>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
