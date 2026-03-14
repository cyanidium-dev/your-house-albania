import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { fetchPropertyBySlug, fetchSiteSettings } from '@/lib/sanity/client';
import { mapSanityPropertyToDetailsFields, mapSanityPropertyGallery } from '@/lib/sanity/propertyAdapter';
import { Icon } from '@iconify/react';
import { getTestimonials } from '@/data/testimonials';
import Link from 'next/link';
import Image from 'next/image';
import { PropertyGallery } from '@/components/Properties/PropertyGallery';

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

export default async function PropertyDetailsPage({ params }: Props) {
  const { slug, locale } = await params;

  const sanityProperty = await fetchPropertyBySlug(slug);
  if (sanityProperty == null) {
    notFound();
  }

  const sanityFields = mapSanityPropertyToDetailsFields(sanityProperty as never, locale);
  const galleryImages = mapSanityPropertyGallery(sanityProperty as never);

  const title = sanityFields.title;
  const location = sanityFields.location;
  const rate = sanityFields.rate;
  const beds = sanityFields.beds;
  const baths = sanityFields.baths;
  const area = sanityFields.area;
  const dealTypeLabel = sanityFields.dealTypeLabel;

  const descriptionParas = sanityFields.description
    ? sanityFields.description.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  const hasCoordinates =
    (sanityProperty as { coordinates?: { lat?: number; lng?: number } | null })?.coordinates != null &&
    typeof (sanityProperty as { coordinates: { lat?: number; lng?: number } })?.coordinates?.lat === 'number' &&
    typeof (sanityProperty as { coordinates: { lat?: number; lng?: number } })?.coordinates?.lng === 'number';
    return (
        <section className="!pt-44 pb-20 relative" >
            <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
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
                        {hasCoordinates && (() => {
                          const coords = (sanityProperty as { coordinates: { lat: number; lng: number } }).coordinates;
                          const embedSrc = `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;
                          return (
                            <iframe src={embedSrc} width="1114" height="400" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-2xl w-full" />
                          );
                        })()}
                    </div>
                    <div className="lg:col-span-4 col-span-12">
                        <div className="bg-primary/10 p-8 rounded-2xl relative z-10 overflow-hidden">
                            <h4 className='text-dark text-3xl font-medium dark:text-white'>
                                {rate}
                            </h4>
                            <p className='text-sm text-dark/50 dark:text-white'>{dealTypeLabel}</p>
                            <Link href="#" className='py-4 px-8 bg-primary text-white rounded-full w-full block text-center hover:bg-dark duration-300 text-base mt-8 hover:cursor-pointer'>
                                Get in touch
                            </Link>
                            <div className="absolute right-0 top-4 -z-[1]">
                                <Image src="/images/properties/vector.svg" width={400} height={500} alt="vector" unoptimized={true} />
                            </div>
                        </div>
                        {getTestimonials().slice(0, 1).map((item, index) => (
                            <div key={index} className="border p-10 rounded-2xl border-dark/10 dark:border-white/20 mt-10 flex flex-col gap-6">
                                <Icon icon="ph:house-simple" width={44} height={44} className="text-primary" />
                                <p className='text-xm text-dark dark:text-white'>{item.review}</p>
                                <div className="flex items-center gap-6">
                                    <Image src={item.image} alt={item.name} width={400} height={500} className='w-20 h-20 rounded-2xl' unoptimized={true} />
                                    <div className="">
                                        <h3 className='text-xm text-dark dark:text-white'>{item.name}</h3>
                                        <h4 className='text-base text-dark/50 dark:text-white/50'>{item.position}</h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
