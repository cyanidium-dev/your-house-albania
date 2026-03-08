import FeaturedProperty from "@/components/Home/FeaturedProperty";
import Hero from "@/components/Home/Hero";
import Properties from "@/components/Home/Properties";
import Cities from "@/components/Home/Cities";
import PropertyTypes from "@/components/Home/PropertyTypes";
import Investment from "@/components/Home/Investment";
import About from "@/components/Home/About";
import AgentsPromo from "@/components/Home/AgentsPromo";
import Services from "@/components/Home/Services";
import Testimonial from "@/components/Home/Testimonial";
import BlogSmall from "@/components/shared/Blog";
import GetInTouch from "@/components/Home/GetInTouch";
import SeoText, { type SeoTextData } from "@/components/Home/SeoText";
import FAQ from "@/components/Home/FAQs";
import {
  fetchHomePage,
  fetchFeaturedProperties,
  fetchActivePropertyTypes,
} from "@/lib/sanity/client";
import { mapSanityPropertyToCard } from "@/lib/sanity/propertyAdapter";
import { normalizeCitiesOrder } from "@/lib/sanity/cityAdapter";
import { mapSanityPropertyTypeToCard } from "@/lib/sanity/propertyTypeAdapter";
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
  let propertyTypesData: {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    propertyTypes: import("@/lib/sanity/propertyTypeAdapter").PropertyTypeCard[];
  } | null = null;
  let investmentData: {
    title?: string;
    description?: string;
    benefits?: string[];
    ctaLabel?: string;
    ctaHref?: string;
    primaryImageUrl?: string;
    primaryImageAlt?: string;
    secondaryImageUrl?: string;
    secondaryImageAlt?: string;
  } | null = null;
  let aboutData: {
    title?: string;
    description?: string;
    benefits?: string[];
  } | null = null;
  let agentsPromoData: {
    title?: string;
    subtitle?: string;
    description?: string;
    benefits?: string[];
    ctaLabel?: string;
    ctaHref?: string;
  } | null = null;
  let seoTextData: SeoTextData = null;
  let faqData: {
    title?: string;
    items: { question: string; answer: string }[];
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
      propertyTypes?: unknown[];
      description?: unknown;
      benefits?: {
        _key?: string;
        en?: string;
        uk?: string;
        ru?: string;
        sq?: string;
        it?: string;
      }[];
      primaryImage?: { asset?: { url?: string }; alt?: string };
      secondaryImage?: { asset?: { url?: string }; alt?: string };
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
    const propertyTypesSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homePropertyTypesSection")
      : undefined;
    if (propertyTypesSection) {
      const pt = propertyTypesSection as {
        title?: unknown;
        subtitle?: unknown;
        cta?: { href?: string; label?: unknown };
        propertyTypes?: unknown[];
      };
      let rawTypes = Array.isArray(pt.propertyTypes) ? pt.propertyTypes : [];
      if (rawTypes.length === 0) {
        const enriched = await fetchActivePropertyTypes(8);
        rawTypes = Array.isArray(enriched) ? enriched : [];
      }
      if (rawTypes.length > 0) {
        const types = (rawTypes as never[]).map((p) =>
          mapSanityPropertyTypeToCard(p, locale),
        );
        propertyTypesData = {
          title: resolveLocalizedString(pt.title as never, locale) || undefined,
          subtitle:
            resolveLocalizedString(pt.subtitle as never, locale) || undefined,
          ctaLabel:
            resolveLocalizedString(pt.cta?.label as never, locale) || undefined,
          ctaHref: pt.cta?.href,
          propertyTypes: types,
        };
      }
    }
    const investmentSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homeInvestmentSection")
      : undefined;
    if (investmentSection) {
      const inv = investmentSection as {
        title?: unknown;
        description?: unknown;
        benefits?: {
          _key?: string;
          en?: string;
          uk?: string;
          ru?: string;
          sq?: string;
          it?: string;
        }[];
        cta?: { href?: string; label?: unknown };
        primaryImage?: { asset?: { url?: string }; alt?: string };
        secondaryImage?: { asset?: { url?: string }; alt?: string };
      };
      const benefitsResolved = Array.isArray(inv.benefits)
        ? inv.benefits
            .map((b) => resolveLocalizedString(b as never, locale))
            .filter(Boolean)
        : [];
      investmentData = {
        title: resolveLocalizedString(inv.title as never, locale) || undefined,
        description:
          resolveLocalizedString(inv.description as never, locale) || undefined,
        benefits: benefitsResolved.length > 0 ? benefitsResolved : undefined,
        ctaLabel:
          resolveLocalizedString(inv.cta?.label as never, locale) || undefined,
        ctaHref: inv.cta?.href,
        primaryImageUrl: (inv.primaryImage as { asset?: { url?: string } })
          ?.asset?.url,
        primaryImageAlt: (inv.primaryImage as { alt?: string })?.alt,
        secondaryImageUrl: (inv.secondaryImage as { asset?: { url?: string } })
          ?.asset?.url,
        secondaryImageAlt: (inv.secondaryImage as { alt?: string })?.alt,
      };
    }
    const aboutSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homeAboutSection")
      : undefined;
    if (aboutSection) {
      const ab = aboutSection as {
        title?: unknown;
        description?: unknown;
        benefits?: {
          _key?: string;
          en?: string;
          uk?: string;
          ru?: string;
          sq?: string;
          it?: string;
        }[];
      };
      const benefitsResolved = Array.isArray(ab.benefits)
        ? ab.benefits
            .map((b) => resolveLocalizedString(b as never, locale))
            .filter(Boolean)
        : [];
      aboutData = {
        title: resolveLocalizedString(ab.title as never, locale) || undefined,
        description:
          resolveLocalizedString(ab.description as never, locale) || undefined,
        benefits: benefitsResolved.length > 0 ? benefitsResolved : undefined,
      };
    }
    const agentsPromoSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homeAgentsPromoSection")
      : undefined;
    if (agentsPromoSection) {
      const ap = agentsPromoSection as {
        title?: unknown;
        subtitle?: unknown;
        description?: unknown;
        benefits?: {
          _key?: string;
          en?: string;
          uk?: string;
          ru?: string;
          sq?: string;
          it?: string;
        }[];
        cta?: { href?: string; label?: unknown };
      };
      const benefitsResolved = Array.isArray(ap.benefits)
        ? ap.benefits
            .map((b) => resolveLocalizedString(b as never, locale))
            .filter(Boolean)
            .slice(0, 3)
        : [];
      agentsPromoData = {
        title: resolveLocalizedString(ap.title as never, locale) || undefined,
        subtitle:
          resolveLocalizedString(ap.subtitle as never, locale) || undefined,
        description:
          resolveLocalizedString(ap.description as never, locale) || undefined,
        benefits: benefitsResolved.length > 0 ? benefitsResolved : undefined,
        ctaLabel:
          resolveLocalizedString(ap.cta?.label as never, locale) || undefined,
        ctaHref: ap.cta?.href,
      };
    }
    const seoTextSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homeSeoTextSection")
      : undefined;
    if (process.env.NODE_ENV === "development") {
      console.log("[Sanity SEO] homeSeoTextSection found:", !!seoTextSection);
      if (seoTextSection) {
        const st = seoTextSection as { content?: unknown };
        console.log("[Sanity SEO] content type:", typeof st.content);
        console.log(
          "[Sanity SEO] content is object:",
          st.content && typeof st.content === "object",
        );
        console.log(
          "[Sanity SEO] content keys:",
          st.content &&
            typeof st.content === "object" &&
            !Array.isArray(st.content)
            ? Object.keys(st.content as object)
            : "n/a",
        );
      } else {
        console.log(
          "[Sanity SEO] sections types:",
          Array.isArray(sections) ? sections.map((s) => s?._type) : [],
        );
      }
    }
    const faqSection = Array.isArray(sections)
      ? sections.find((s) => s?._type === "homeFaqSection")
      : undefined;
    if (faqSection) {
      const fq = faqSection as {
        title?: unknown;
        items?: { _key?: string; question?: unknown; answer?: unknown }[];
      };
      const rawItems = Array.isArray(fq.items) ? fq.items : [];
      const itemsResolved = rawItems
        .map((item) => {
          const q = resolveLocalizedString(item.question as never, locale);
          const a = resolveLocalizedString(item.answer as never, locale);
          if (q || a) return { question: q || "", answer: a || "" };
          return null;
        })
        .filter(
          (x): x is { question: string; answer: string } => x !== null,
        );
      if (itemsResolved.length > 0) {
        faqData = {
          title: resolveLocalizedString(fq.title as never, locale) || undefined,
          items: itemsResolved,
        };
      }
    }
    if (seoTextSection) {
      const { resolveLocalizedString, resolveLocalizedContent } =
        await import("@/lib/sanity/localized");
      const st = seoTextSection as { content?: unknown };
      const raw = st.content;
      if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
        const str = resolveLocalizedString(raw as never, locale);
        if (str.trim()) seoTextData = { content: str, isPlainText: true };
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[Sanity SEO] resolved plain text length:",
            str?.length ?? 0,
          );
        }
      } else if (Array.isArray(raw)) {
        const arr = resolveLocalizedContent(raw as never, locale);
        if (arr.length > 0) seoTextData = { content: arr, isPlainText: false };
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[Sanity SEO] resolved portable text blocks:",
            arr?.length ?? 0,
          );
        }
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
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[Sanity SEO] seoTextData resolved:",
      !!seoTextData,
      seoTextData ? "has content" : "null/empty",
    );
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
      {propertyTypesData && (
        <PropertyTypes locale={locale} propertyTypesData={propertyTypesData} />
      )}
      <Investment locale={locale} investmentData={investmentData} />
      <About locale={locale} aboutData={aboutData} />
      <AgentsPromo agentsPromoData={agentsPromoData} />
      <SeoText seoTextData={seoTextData} />
      {/* template files */}
      <Services locale={locale} />
      <FeaturedProperty locale={locale} />
      <Testimonial />
      <BlogSmall locale={locale} />
      <GetInTouch />
      {(!faqData || faqData.items.length > 0) && <FAQ faqData={faqData} />}
    </main>
  );
}
