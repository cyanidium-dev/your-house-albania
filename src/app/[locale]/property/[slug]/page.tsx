import type { Metadata } from 'next';
import React from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { fetchPropertyBySlug, fetchSiteSettings, fetchSimilarPropertyCandidates } from '@/lib/sanity/client';
import { mapSanityPropertyToDetailsFields, mapSanityPropertyGallery, mapCatalogPropertyToCard, mapPropertyAmenityDisplayItems, mapSanityPropertyOffers, resolvePropertyIconKey } from '@/lib/sanity/propertyAdapter';
import { buildPropertyMetadata } from '@/lib/sanity/propertySeoAdapter';
import { Icon } from "@/components/shared/Icon";
import { PropertyLocationMap } from '@/components/catalog/map/PropertyLocationMap';
import Image from 'next/image';
import { PropertyGallery } from '@/components/Properties/PropertyGallery';
import { buildPropertyGalleryImages } from '@/lib/property/propertyGalleryImages';
import { canonicalPropertyImageUrl } from '@/lib/images/propertyImageUrl';
import { PropertyFactRow } from '@/components/property/PropertyFactRow';
import { PropertyDetailBreadcrumb } from '@/components/shared/PropertyDetailBreadcrumb';
import { PropertyDeveloperBadge, type PropertyDeveloperRef } from '@/components/shared/property/PropertyDeveloperBadge';
import { PropertyMarketPositionSection } from '@/components/shared/property/PropertyMarketPositionSection';
import { computeMarketPosition, attachMarketPositionToCards } from '@/lib/property/marketPosition';
import { showsPlotArea, showsRooms } from '@/lib/property/plotArea';
import { propertyOgImageUrl } from '@/lib/seo/ogImageUrl';
import { fetchLatestZoneMetricsByZoneId } from '@/lib/sanity/queries/zoneMetrics';
import { fetchDistrictPriceRows } from '@/lib/sanity/queries/property';
import { PropertyOwnershipCostsSection } from '@/components/shared/property/PropertyOwnershipCostsSection';
import { PropertyPriceHistorySection } from '@/components/shared/property/PropertyPriceHistorySection';
import { GuideDownloadCard } from '@/components/guides/GuideDownloadCard';
import { comparableTypeSlugs, computeOwnershipCosts, rankInDistrict } from '@/lib/property/ownershipCosts';
import { utilityCityFor } from '@/lib/calculators/utilities';
import TrackPageView from "@/components/analytics/TrackPageView";
import MobileStickyBar from "@/components/property/MobileStickyBar";
import AiPropertyPanel from "@/components/ai/AiPropertyPanel";
import { isAiSearchEnabled } from "@/lib/ai/config";
import { PropertyJsonLd } from '@/components/shared/PropertyJsonLd';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { getBaseUrl } from '@/lib/seo/baseUrl';
import { composePropertyMetaTitle, truncateMetaDescription } from '@/lib/seo/propertyMeta';
import { resolveLocalizedString } from '@/lib/sanity/localized';
import { getSiteBaseUrl } from '@/lib/siteUrl';
import { PriceText } from '@/components/shared/PriceText';
import { PropertyAmenitiesSection } from '@/components/property/PropertyAmenitiesSection';
import { PropertyContactButton } from '@/components/property/PropertyContactModal';
import { MessengerButtons } from '@/components/contact/MessengerButtons';
import { resolveMessengers } from '@/lib/contacts/messengers';
import { SimilarPropertiesCarousel } from '@/components/property/SimilarPropertiesCarousel';
import { PropertyArticlesSection } from '@/components/property/PropertyArticlesSection';
import {getTranslations, setRequestLocale} from 'next-intl/server';
// `catalogPath` already returns a locale-prefixed path, so this uses next/link
// rather than the i18n Link, which would prefix the locale a second time.
import Link from 'next/link';
import { catalogPath } from '@/lib/routes/catalog';
import { propertyPath, propertyUrlSlug, type LocalizedSlug } from '@/lib/property/propertyUrl';

/**
 * ISR. Two exports, and the route needs both.
 *
 * `generateStaticParams` is empty on purpose: nothing is prerendered at build
 * time, but declaring it is what puts the route on the incremental path.
 * Without it Next has no params to generate, treats the route as fully
 * dynamic and ignores `revalidate` — which is what left the site's ~1,470
 * content URLs answering `no-store` even after the root layout and the
 * request-locale fixes had made the 86 parameterless pages cacheable.
 *
 * The hour is a backstop, not the publishing delay: the Sanity webhook
 * (`/api/revalidate/sanity`) purges the tags a mutated document touches, so an
 * edit reaches the page as soon as the webhook fires.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

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
  // Cut on a word boundary rather than letting Google truncate mid-word: 29 of
  // 35 descriptions run past the SERP limit.
  const itemDescription = truncateMetaDescription(fields.description) || undefined;

  // Composed from the property's own fields, never stored — see propertyMeta.
  const raw = sanityProperty as {
    price?: number;
    priceUnit?: string;
    area?: number;
    status?: string;
    type?: { title?: unknown };
    city?: { title?: unknown };
    district?: { title?: unknown };
  };
  const tMeta = await getTranslations({ locale, namespace: 'PropertyMeta' });
  const composedTitle = composePropertyMetaTitle({
    typeLabel: resolveLocalizedString(raw?.type?.title as never, locale) || undefined,
    area: raw?.area,
    district: resolveLocalizedString(raw?.district?.title as never, locale) || undefined,
    city: resolveLocalizedString(raw?.city?.title as never, locale) || undefined,
    price: raw?.price,
    priceUnit: raw?.priceUnit,
    status: raw?.status,
    locale,
    areaUnit: tMeta('areaUnit'),
    perMonth: tMeta('perMonth'),
  });

  const coverImageUrl = (sanityProperty as { gallery?: Array<{ asset?: { url?: string } }> })?.gallery?.[0]?.asset?.url;
  const keySlug = (sanityProperty as { slug?: string }).slug || slug;
  const localizedSlug = (sanityProperty as { localizedSlug?: LocalizedSlug }).localizedSlug;

  const baseUrl = ((await getBaseUrl()) || getSiteBaseUrl()).replace(/\/$/, '');

  return buildPropertyMetadata(
    propertySeo as never,
    defaultSeo as never,
    locale,
    {
      itemTitle,
      composedTitle,
      itemDescription,
      coverImageUrl: coverImageUrl ?? undefined,
      // The photo with the price, size and layout drawn over it, in this
      // locale — see /api/og. Only a hand-picked seo.ogImage beats it.
      generatedOgImageUrl: coverImageUrl ? propertyOgImageUrl({ locale, slug: keySlug }) : undefined,
      propertyPath: { baseUrl, locale, slug: keySlug, localizedSlug },
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
  setRequestLocale(locale);
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

  // The request may carry the listing's key, another locale's address or an
  // old one; each lands on this locale's address. `urlSlug` is only ever used
  // in URLs — favourites, leads, analytics and the AI keep the key.
  const keySlug = (sanityProperty as { slug?: string }).slug || slug;
  const localizedSlug = (sanityProperty as { localizedSlug?: LocalizedSlug }).localizedSlug;
  const urlSlug = propertyUrlSlug(locale, keySlug, localizedSlug);
  if (slug !== urlSlug) {
    permanentRedirect(propertyPath(locale, keySlug, localizedSlug));
  }

  const similarCount = getSimilarCount(siteSettings);
  const citySlug = (sanityProperty as { city?: { slug?: string } })?.city?.slug;
  const districtId = (sanityProperty as { district?: { _id?: string } })?.district?._id;
  const comparableTypes = comparableTypeSlugs(
    (sanityProperty as { type?: { slug?: string } })?.type?.slug ?? null,
  );
  const [similarCandidates, zoneMetrics, districtPriceRows] = await Promise.all([
    fetchSimilarPropertyCandidates(
      (sanityProperty as { _id: string })._id,
      citySlug ?? null,
      similarCount
    ),
    districtId ? fetchLatestZoneMetricsByZoneId(districtId) : Promise.resolve(null),
    districtId && comparableTypes ? fetchDistrictPriceRows(districtId, comparableTypes) : Promise.resolve([]),
  ]);
  const similarItems = await attachMarketPositionToCards(
    similarCandidates.map((c) => mapCatalogPropertyToCard(c, locale))
  );

  const sanityFields = mapSanityPropertyToDetailsFields(sanityProperty as never, locale);

  const title = sanityFields.title;
  const location = sanityFields.location;
  const beds = sanityFields.beds;
  const rooms = sanityFields.rooms;
  const baths = sanityFields.baths;
  const area = sanityFields.area;
  const yearBuilt = (sanityProperty as { yearBuilt?: number } | null)?.yearBuilt;
  const propertyTypeSlug = (sanityProperty as { type?: { slug?: string } })?.type?.slug ?? null;

  const sanityWithCoords = sanityProperty as {
    coordinates?: { lat?: number; lng?: number } | null;
    coordinatesLat?: number | null;
    coordinatesLng?: number | null;
    locationPrecision?: string | null;
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
  // Most listings arrived without a street address, so their pin is the centre
  // of the district rather than the building. Say so under the map instead of
  // letting the marker imply a precision the data does not have.
  const locationIsApproximate = sanityWithCoords?.locationPrecision === 'approximate';
  const districtSlug = (sanityProperty as { district?: { slug?: string } })?.district?.slug;

  const rawProperty = sanityProperty as {
    price?: number;
    priceUnit?: "total" | "per-sqm";
    currency?: string;
    status?: string;
  };
  const marketPosition = computeMarketPosition(
    { price: rawProperty.price, priceUnit: rawProperty.priceUnit, area, yearBuilt },
    zoneMetrics,
  );
  const ownershipCosts = computeOwnershipCosts({
    price: rawProperty.price,
    priceUnit: rawProperty.priceUnit,
    area,
    typeSlug: propertyTypeSlug,
    utilityCity: utilityCityFor(citySlug, districtSlug),
    referencePriceMin: zoneMetrics?.referencePriceMin ?? zoneMetrics?.referencePrice,
    referencePriceMax: zoneMetrics?.referencePriceMax ?? zoneMetrics?.referencePrice,
  });
  const districtRank = rankInDistrict(
    { price: rawProperty.price, priceUnit: rawProperty.priceUnit, area },
    districtPriceRows,
  );
  const districtName =
    resolveLocalizedString((sanityProperty as { district?: { title?: unknown } })?.district?.title as never, locale) ||
    null;
  const baseUrl = await getBaseUrl();
  // Every photo gets a readable file name and an alt in this locale; JSON-LD
  // then publishes the same single variant the `<img src>` and the image
  // sitemap use, instead of the untransformed original.
  const galleryFacts = sanityProperty as {
    type?: { title?: unknown; slug?: string };
    bedrooms?: number;
    city?: { title?: unknown; slug?: string };
    amenitiesRefs?: Array<{ slug?: string }>;
    beachfront?: boolean;
    seaDistanceMeters?: number;
    constructionStage?: string;
  };
  const galleryImages = buildPropertyGalleryImages(mapSanityPropertyGallery(sanityProperty as never), {
    locale,
    typeLabel: resolveLocalizedString(galleryFacts.type?.title as never, locale) || null,
    typeSlug: propertyTypeSlug,
    bedrooms: galleryFacts.bedrooms ?? null,
    areaM2: area,
    district: districtName,
    districtSlug: districtSlug ?? null,
    city: resolveLocalizedString(galleryFacts.city?.title as never, locale) || null,
    citySlug: citySlug ?? null,
    deal: rawProperty.status ?? null,
    amenitySlugs: (galleryFacts.amenitiesRefs ?? []).map((a) => a?.slug),
    beachfront: galleryFacts.beachfront ?? null,
    seaDistanceMeters: galleryFacts.seaDistanceMeters ?? null,
    constructionStage: galleryFacts.constructionStage ?? null,
  });
  const imageUrls = galleryImages.map((img) => canonicalPropertyImageUrl(img.url));

  const t = await getTranslations('Shared.propertyCard');
  const tPropertyDetail = await getTranslations('Shared.propertyDetail');
  const tContactBar = await getTranslations('ContactBar');
  const tQuickContact = await getTranslations('QuickContact');
  // A house is bought with its land, so the tile is always there on a house —
  // saying "not specified" beats leaving the buyer to wonder whether we forgot.
  const plotFact = showsPlotArea(propertyTypeSlug)
    ? sanityFields.plotArea
      ? tPropertyDetail('plotArea', { value: sanityFields.plotArea })
      : tPropertyDetail('plotAreaUnknown')
    : null;
  const amenities = mapPropertyAmenityDisplayItems(sanityProperty as never, locale);
  const propertyOffers = mapSanityPropertyOffers(sanityProperty as never, locale);

  const articlesSection = (sanityProperty as { articlesSection?: unknown }).articlesSection;

  const dealTypeKey = (() => {
    const s = (rawProperty.status ?? '').toLowerCase();
    if (s === 'sale') return 'dealTypeSale';
    if (s === 'rent') return 'dealTypeRent';
    if (s === 'short-term' || s === 'shortterm') return 'dealTypeShortTerm';
    if (s === 'long-term' || s === 'longterm') return 'dealTypeLongTerm';
    return 'dealTypePrice';
  })();
  const dealTypeLabel = tPropertyDetail(dealTypeKey);

  const propertyAgent = (sanityProperty as { agent?: { name?: string; slug?: string } | null }).agent ?? null;

  // Platform messengers next to the inquiry form, Telegram first for ru/uk.
  // The listing carries no lister contact of its own (the agent projection is
  // name + slug), so these are always the platform's.
  const messengers = resolveMessengers(
    (siteSettings as { socialLinks?: { platform: string; url: string; channel?: string }[] } | null)?.socialLinks,
    locale,
  );
  const messengerAriaLabels = {
    whatsapp: tQuickContact('channel.whatsapp'),
    telegram: tQuickContact('channel.telegram'),
  };

  // Listing dimensions for analytics: the view event and every lead from this page.
  const propertyLeadAnalytics = {
    city: (sanityProperty as { city?: { slug?: string } })?.city?.slug,
    district: (sanityProperty as { district?: { slug?: string } })?.district?.slug,
    propertyType: (sanityProperty as { type?: { slug?: string } })?.type?.slug,
    priceEur: rawProperty.price ?? undefined,
  };

  return (
        <section className="pt-20 md:pt-32 pb-24 lg:pb-20 relative">
            <TrackPageView
              kind="property"
              slug={keySlug}
              event={{
                event: "property_view",
                slug: keySlug,
                ...propertyLeadAnalytics,
              }}
            />
            <PropertyJsonLd
              name={title}
              slug={urlSlug}
              description={sanityFields.description || null}
              location={location || null}
              countryCode={(sanityProperty as { city?: { countryCode?: string } })?.city?.countryCode ?? null}
              price={rawProperty.price ?? null}
              priceUnit={rawProperty.priceUnit ?? null}
              status={rawProperty.status ?? null}
              lifecycleStatus={(sanityProperty as { lifecycleStatus?: string })?.lifecycleStatus ?? null}
              propertyTypeSlug={(sanityProperty as { type?: { slug?: string } })?.type?.slug ?? null}
              rooms={rooms ?? undefined}
              beds={beds}
              baths={baths}
              area={area}
              plotArea={sanityFields.plotArea ?? undefined}
              yearBuilt={yearBuilt}
              datePosted={(sanityProperty as { createdAt?: string })?.createdAt ?? null}
              imageUrls={imageUrls}
              baseUrl={baseUrl}
              locale={locale}
              districtName={districtName}
              cityName={resolveLocalizedString((sanityProperty as { city?: { title?: unknown } })?.city?.title as never, locale) || null}
              geo={locationIsApproximate ? null : resolvedCoordinates}
              amenityNames={amenities.map((a) => a.title)}
            />
            <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
                <PropertyDetailBreadcrumb
                  locale={locale}
                  propertyTitle={title}
                  propertySlug={urlSlug}
                  citySlug={citySlug}
                  districtSlug={districtSlug}
                />
                {/* Title row answers the buyer's first questions before the
                    gallery: what and where on the left, how much and what to do
                    next on the right. The price used to appear only in the
                    sidebar below the gallery, one full screen down on desktop. */}
                <div className="grid grid-cols-12 items-start gap-6 lg:gap-10">
                    <div className="lg:col-span-8 col-span-12 min-w-0">
                        <h1 className='text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-dark dark:text-white text-balance'>{title}</h1>
                        <div className="mt-2 flex items-center gap-2">
                            <Icon icon="ph:map-pin" width={20} height={20} className="shrink-0 text-dark/50 dark:text-white/50" />
                            <p className='text-dark/60 dark:text-white/60 text-base'>{location}</p>
                        </div>
                        <PropertyDeveloperBadge
                          locale={locale}
                          developer={(sanityProperty as { developer?: PropertyDeveloperRef }).developer ?? null}
                        />
                        <div className="mt-5">
                          <PropertyFactRow
                              facts={[
                                  ...(rooms ? [{ key: 'rooms', icon: 'solar:home-2-linear', label: t('roomsCount', { count: rooms }) }] : []),
                                  ...(showsRooms(propertyTypeSlug)
                                    ? [
                                        { key: 'beds', icon: 'solar:bed-linear', label: t('bedroomsCount', { count: beds }) },
                                        { key: 'baths', icon: 'solar:bath-linear', label: t('bathroomsCount', { count: baths }) },
                                      ]
                                    : []),
                                  ...(area > 0 ? [{ key: 'area', icon: 'lineicons:arrow-all-direction', label: `${area}${t('areaUnit')}` }] : []),
                                  ...(plotFact ? [{ key: 'plot', icon: 'solar:map-linear', label: plotFact }] : []),
                                  ...(yearBuilt ? [{ key: 'year', icon: 'solar:calendar-linear', label: tPropertyDetail('yearBuilt', { year: yearBuilt }) }] : []),
                                  // The distance to the sea was read for the photo alt text
                                  // only; it is the fact a coast buyer asks first.
                                  ...(galleryFacts.beachfront
                                    ? [{ key: 'sea', icon: 'ph:waves', label: tPropertyDetail('beachfront') }]
                                    : typeof galleryFacts.seaDistanceMeters === 'number' && galleryFacts.seaDistanceMeters > 0
                                      ? [{ key: 'sea', icon: 'ph:waves', label: tPropertyDetail('seaDistance', { m: galleryFacts.seaDistanceMeters }) }]
                                      : []),
                              ]}
                          />
                        </div>
                    </div>
                    <div className="lg:col-span-4 col-span-12 lg:border-l lg:border-dark/10 lg:dark:border-white/10 lg:pl-10">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className='text-3xl lg:text-[2rem] font-semibold leading-none tracking-tight text-dark dark:text-white tabular-nums'>
                                    <PriceText amountEur={rawProperty.price ?? null} priceUnit={rawProperty.priceUnit} locale={locale} />
                                </p>
                                <p className='mt-2 text-sm text-dark/60 dark:text-white/60'>{dealTypeLabel}</p>
                                {propertyAgent?.slug && propertyAgent?.name ? (
                                  <p className='mt-1 text-sm text-dark/60 dark:text-white/70'>
                                    {tPropertyDetail.rich('listedBy', {
                                      name: propertyAgent.name,
                                      link: (chunks) => (
                                        <Link
                                          href={catalogPath(locale, undefined, undefined, propertyAgent.slug)}
                                          className='underline underline-offset-2 hover:text-primary duration-300'
                                        >
                                          {chunks}
                                        </Link>
                                      ),
                                    })}
                                  </p>
                                ) : null}
                            </div>
                            <FavoriteButton slug={keySlug} name={title} variant="inline" imageUrl={galleryImages[0]?.url ?? null} />
                        </div>
                        {/* Phones get the same CTA in the sticky bottom bar. */}
                        <div className="hidden lg:block">
                          <PropertyContactButton
                            locale={locale}
                            propertySlug={keySlug}
                            propertyTitle={title}
                            agentSlug={propertyAgent?.slug ?? null}
                            agentName={propertyAgent?.name ?? null}
                            analytics={propertyLeadAnalytics}
                            label={tPropertyDetail('getInTouch')}
                            className='mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-dark hover:cursor-pointer'
                          />
                          <div data-lead-placement="property" data-property-slug={keySlug}>
                            <MessengerButtons
                              messengers={messengers}
                              ariaLabels={messengerAriaLabels}
                              className="mt-2 flex gap-2"
                            />
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
                          closeLabel={tPropertyDetail('close')}
                        />
                        )}
                        {sanityFields.description ? (
                          <p className='text-dark dark:text-white text-xm whitespace-pre-line'>
                            {sanityFields.description}
                          </p>
                        ) : null}
                        {propertyOffers.length > 0 && (
                        <div className="py-8 mt-8 border-t border-dark/5 dark:border-white/15">
                            <h3 className='text-xl font-medium'>{tPropertyDetail('whatThisPropertyOffers')}</h3>
                            <div className="grid grid-cols-3 mt-5 gap-6">
                                {propertyOffers.map((item) => (
                                  <div key={item.key} className="flex items-center gap-2.5">
                                    {item.customIconUrl ? (
                                      <Image src={item.customIconUrl} width={24} height={24} alt={item.customIconAlt ?? ''} className="w-6 h-6 object-contain shrink-0 dark:invert" unoptimized={true} />
                                    ) : (
                                      <Icon icon={resolvePropertyIconKey(item.iconKey)} width={24} height={24} className="text-dark dark:text-white shrink-0" />
                                    )}
                                    <p className='text-base dark:text-white text-dark'>{item.title}</p>
                                  </div>
                                ))}
                            </div>
                        </div>
                        )}
                        <PropertyMarketPositionSection
                          locale={locale}
                          marketPosition={marketPosition}
                          citySlug={citySlug}
                          districtSlug={districtSlug}
                        />
                        <PropertyOwnershipCostsSection
                          locale={locale}
                          costs={ownershipCosts}
                          rank={districtRank}
                          districtName={districtName}
                          area={area}
                          rateEur={rawProperty.priceUnit === 'per-sqm' ? rawProperty.price ?? null : null}
                        />
                        <PropertyPriceHistorySection
                          locale={locale}
                          history={(sanityProperty as { priceHistory?: Array<{ date?: string; price?: number; priceUnit?: string | null }> }).priceHistory}
                        />
                        {/* Durrës listings only: the PDF guide that expands the
                            cost block above, for an email. */}
                        <GuideDownloadCard
                          locale={locale}
                          citySlug={citySlug}
                          propertySlug={keySlug}
                          subject={{ propertySlug: keySlug, ...propertyLeadAnalytics }}
                          variant="compact"
                        />
                        {/* Straight after the market verdict: the visitor has
                            just read how this price sits against the district,
                            and "so is it worth it?" is the next thought. At the
                            foot of the page it sat below the similar-properties
                            carousel, 52% of the way down, and went unfound. */}
                        {isAiSearchEnabled() ? (
                          <AiPropertyPanel locale={locale} propertySlug={keySlug} />
                        ) : null}
                    </div>
                    <div className="lg:col-span-4 col-span-12 lg:sticky lg:top-30">
                        <div className="hidden lg:block bg-primary/10 p-8 rounded-2xl relative z-10 overflow-hidden">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h4 className='text-dark text-3xl font-medium dark:text-white'>
                                  <PriceText amountEur={rawProperty.price ?? null} priceUnit={rawProperty.priceUnit} locale={locale} />
                              </h4>
                              <FavoriteButton slug={keySlug} name={title} variant="inline" imageUrl={galleryImages[0]?.url ?? null} />
                            </div>
                            <p className='text-sm text-dark/50 dark:text-white'>{dealTypeLabel}</p>
                            {propertyAgent?.slug && propertyAgent?.name ? (
                              // The agent pages carried no inbound link anywhere on the site and
                              // were reachable only from a sitemap (SEO-08 audit, 02.09.2026).
                              // Naming who listed the property is also the honest thing to show
                              // next to the price.
                              <p className='text-sm text-dark/60 dark:text-white/70 mt-2'>
                                {tPropertyDetail.rich('listedBy', {
                                  name: propertyAgent.name,
                                  link: (chunks) => (
                                    <Link
                                      href={catalogPath(locale, undefined, undefined, propertyAgent.slug)}
                                      className='underline underline-offset-2 hover:text-primary duration-300'
                                    >
                                      {chunks}
                                    </Link>
                                  ),
                                })}
                              </p>
                            ) : null}
                            <PropertyContactButton
                              locale={locale}
                              propertySlug={keySlug}
                              propertyTitle={title}
                              agentSlug={propertyAgent?.slug ?? null}
                              agentName={propertyAgent?.name ?? null}
                              analytics={propertyLeadAnalytics}
                              label={tPropertyDetail('getInTouch')}
                              className='py-4 px-8 bg-primary text-white rounded-full w-full block text-center hover:bg-dark duration-300 text-base mt-8 hover:cursor-pointer'
                            />
                            <div data-lead-placement="property" data-property-slug={keySlug}>
                              <MessengerButtons
                                messengers={messengers}
                                ariaLabels={messengerAriaLabels}
                                className="mt-3 flex gap-2"
                              />
                            </div>
                            <div className="absolute right-0 top-4 -z-[1]">
                                <Image src="/images/properties/vector.svg" width={400} height={500} alt="vector" unoptimized={true} />
                            </div>
                        </div>
                        <div className="mt-10">
                          <PropertyLocationMap
                            coordinates={resolvedCoordinates}
                            mapHeightClassName="h-[210px]"
                          />
                          {resolvedCoordinates && locationIsApproximate ? (
                            <p className="mt-2 text-xs text-dark/50 dark:text-white/50">
                              {tPropertyDetail('approximateLocation')}
                            </p>
                          ) : null}
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
                <PropertyArticlesSection locale={locale} section={articlesSection} />
            </div>
            {/* Mobile-only sticky bottom bar: price + CTA. It reserves its own
                room at the end of the document — see MobileStickyBar. */}
            <MobileStickyBar placement="property" propertySlug={keySlug} label={tContactBar('barLabel')}>
              <div className='flex items-center gap-2 px-4 py-3 bg-primary/50'
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
                <div className="min-w-0 flex-1">
                  <h4 className="text-dark dark:text-white text-lg font-semibold leading-tight truncate">
                    <PriceText amountEur={rawProperty.price ?? null} priceUnit={rawProperty.priceUnit} locale={locale} />
                  </h4>
                  <p className="text-sm text-dark/50 dark:text-white/50 truncate">{dealTypeLabel}</p>
                </div>
                <MessengerButtons
                  messengers={messengers}
                  ariaLabels={messengerAriaLabels}
                  variant="icon"
                  className="flex shrink-0 gap-2 [&>a]:bg-white dark:[&>a]:bg-dark"
                />
                {/* Short label so the price keeps its room on a 360px screen; the
                    accessible name says the whole thing. */}
                <PropertyContactButton
                  locale={locale}
                  propertySlug={keySlug}
                  propertyTitle={title}
                  agentSlug={propertyAgent?.slug ?? null}
                  agentName={propertyAgent?.name ?? null}
                  analytics={propertyLeadAnalytics}
                  label={tContactBar('ask')}
                  ariaLabel={tContactBar('askProperty')}
                  className="shrink-0 h-11 px-5 bg-primary text-white rounded-full text-base font-semibold hover:bg-dark duration-300 transition-colors text-center whitespace-nowrap"
                />
              </div>
            </MobileStickyBar>
        </section>
    );
}
