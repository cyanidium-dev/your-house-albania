import FeaturedProperty from "@/components/Home/FeaturedProperty";
import Hero from "@/components/Home/Hero";
import Properties from "@/components/Home/Properties";
import Cities from "@/components/Home/Cities";
import Services from "@/components/Home/Services";
import Testimonial from "@/components/Home/Testimonial";
import BlogSmall from "@/components/shared/Blog";
import GetInTouch from "@/components/Home/GetInTouch";
import FAQ from "@/components/Home/FAQs";
import { fetchHomePage, fetchFeaturedProperties } from "@/lib/sanity/client";
import { mapSanityPropertyToCard } from "@/lib/sanity/propertyAdapter";
import { normalizeCitiesOrder } from "@/lib/sanity/cityAdapter";
import type { PropertyHomes } from "@/types/properyHomes";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;

  const homePage = await fetchHomePage();
  let heroData: {
    shortLine?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
  } | null = null;
  let propertiesData: {
    badge?: string;
    title?: string;
    description?: string;
  } | null = null;
  let propertyItems: PropertyHomes[] | null = null;
  let citiesData: {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    cities: import("@/lib/sanity/cityAdapter").CityCard[];
  } | null = null;

  if (homePage !== null) {
    const doc = homePage as {
      _id?: string;
      homepageSections?: unknown[];
      seo?: unknown;
    };
    const sections = (doc?.homepageSections ?? []) as {
      _type?: string;
      mode?: string;
      title?: unknown;
      subtitle?: unknown;
      shortLine?: unknown;
      cta?: { href?: string; label?: unknown };
      properties?: unknown[];
      cities?: unknown[];
    }[];
    const heroSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homeHeroSection")
      : undefined;
    const { resolveLocalizedString } = await import("@/lib/sanity/localized");
    if (heroSection) {
      heroData = {
        shortLine: resolveLocalizedString(
          heroSection.shortLine as never,
          locale,
        ),
        title: resolveLocalizedString(heroSection.title as never, locale),
        subtitle: resolveLocalizedString(heroSection.subtitle as never, locale),
        ctaLabel: resolveLocalizedString(
          heroSection.cta?.label as never,
          locale,
        ),
        ctaHref: heroSection.cta?.href,
      };
    }
    const secondSection =
      Array.isArray(sections) && sections.length > 1 ? sections[1] : undefined;
    if (secondSection) {
      const s = secondSection as {
        _type?: string;
        mode?: string;
        shortLine?: unknown;
        title?: unknown;
        subtitle?: unknown;
        properties?: unknown[];
      };
      propertiesData = {
        badge:
          resolveLocalizedString(s.shortLine as never, locale) || undefined,
        title: resolveLocalizedString(s.title as never, locale) || undefined,
        description:
          resolveLocalizedString(s.subtitle as never, locale) || undefined,
      };
      if (
        !propertiesData.badge &&
        !propertiesData.title &&
        !propertiesData.description
      ) {
        propertiesData = null;
      }
      if (s._type === "homePropertyCarouselSection") {
        const mode = s.mode ?? "auto";
        if (
          mode === "selected" &&
          Array.isArray(s.properties) &&
          s.properties.length > 0
        ) {
          propertyItems = s.properties.map((prop) =>
            mapSanityPropertyToCard(prop as never, locale),
          );
        } else if (mode === "auto") {
          const featured = await fetchFeaturedProperties(6);
          if (Array.isArray(featured) && featured.length > 0) {
            propertyItems = featured.map((prop) =>
              mapSanityPropertyToCard(prop as never, locale),
            );
          }
        }
      }
    }
    const locationSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homeLocationCarouselSection")
      : undefined;
    if (locationSection) {
      const loc = locationSection as {
        title?: unknown;
        subtitle?: unknown;
        cta?: { href?: string; label?: unknown };
        cities?: unknown[];
      };
      const rawCities = Array.isArray(loc.cities) ? loc.cities : [];
      if (rawCities.length > 0) {
        const cities = normalizeCitiesOrder(rawCities as never[], locale);
        citiesData = {
          title:
            resolveLocalizedString(loc.title as never, locale) || undefined,
          subtitle:
            resolveLocalizedString(loc.subtitle as never, locale) || undefined,
          ctaLabel:
            resolveLocalizedString(loc.cta?.label as never, locale) ||
            undefined,
          ctaHref: loc.cta?.href,
          cities,
        };
      }
    }
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      console.log("[Sanity] Skipped: NEXT_PUBLIC_SANITY_PROJECT_ID not set");
    } else {
      const sectionTypes = Array.isArray(sections)
        ? sections.map((s) => s?._type).filter(Boolean)
        : [];
      console.log("[Sanity] homePage:", {
        found: !!doc?._id,
        sectionsCount: sections.length,
        sectionTypes,
        hasSeo: !!doc?.seo,
        heroResolved: !!heroData,
      });
    }
  } else if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    console.log("[Sanity] Skipped: NEXT_PUBLIC_SANITY_PROJECT_ID not set");
  } else {
    console.log("[Sanity] homePage not found or fetch failed");
  }

  return (
    <main>
      <Hero locale={locale} heroData={heroData} />
      <Properties
        locale={locale}
        propertiesData={propertiesData}
        propertyItems={propertyItems}
      />
      {citiesData && <Cities locale={locale} citiesData={citiesData} />}
      {/* <Services locale={locale} /> */}
      <FeaturedProperty locale={locale} />
      <Testimonial />
      <BlogSmall locale={locale} />
      <GetInTouch />
      <FAQ />
    </main>
  );
}
