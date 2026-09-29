import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { DistrictsBreadcrumb } from "@/components/shared/DistrictsBreadcrumb";
import FAQ from "@/components/landing/sections/impl/FaqSectionImpl";
import { galleryItemClass } from "@/components/landing/sections/LinkedGallerySection";
import { CONTAINER, MEASURE, Section, SectionHeading, SECTION_LEAD } from "@/components/shared/layout";
import type { DistrictDoc } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { photoForCity } from "@/lib/media/albaniaPhotos";
import { brandButtonClass } from "@/components/shared/BrandButton";

type Props = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  district: DistrictDoc;
};

/**
 * Fallback district editorial template (no dedicated district `landingPage`).
 * Composes existing UI patterns: breadcrumb header, hero, description, gallery,
 * FAQ accordion and SEO text — same container/spacing as `CityLandingPageBody` sections.
 */
export async function DistrictPageBody({ locale, countrySlug, citySlug, district }: Props) {
  const t = await getTranslations("Districts");
  const tPhoto = await getTranslations("AlbaniaPhotos");

  const title =
    resolveLocalizedString(district.heroTitle as never, locale) ||
    resolveLocalizedString(district.title as never, locale) ||
    district.slug ||
    "";
  const districtLabel =
    resolveLocalizedString(district.title as never, locale) || district.slug || "";
  const subtitle =
    resolveLocalizedString(district.heroSubtitle as never, locale) ||
    resolveLocalizedString(district.shortDescription as never, locale);
  const shortLine = resolveLocalizedString(district.heroShortLine as never, locale);
  const heroImageUrl = district.heroImage?.asset?.url;
  // Roughly a fifth of the districts have no photograph in the CMS. Showing
  // the parent city instead of an empty hero is honest as long as the alt
  // text says what the picture is, which it does — it comes from the photo,
  // not from the district name.
  const fallbackPhoto = heroImageUrl ? null : photoForCity(citySlug);
  const heroCtaLabel = resolveLocalizedString(district.heroCta?.label as never, locale);
  const heroCtaHref = district.heroCta?.href?.trim()
    ? resolveLocaleHref(district.heroCta.href.trim(), locale)
    : null;
  const description = resolveLocalizedString(district.description as never, locale);
  const galleryImages = (district.gallery ?? []).filter((img) => img?.asset?.url);
  const galleryTitle = resolveLocalizedString(district.galleryTitle as never, locale);
  const gallerySubtitle = resolveLocalizedString(district.gallerySubtitle as never, locale);
  const faqItems = (district.faqItems ?? [])
    .map((item) => ({
      key: item._key,
      question: resolveLocalizedString(item.question as never, locale),
      answer: resolveLocalizedString(item.answer as never, locale),
    }))
    .filter((item) => item.question && item.answer);
  const faqTitle = resolveLocalizedString(district.faqTitle as never, locale) || t("faqTitle");
  const seoText = resolveLocalizedString(district.seoText as never, locale);

  return (
    <>
      {/* Hero */}
      <section className="pt-20 md:pt-32">
        <div className={CONTAINER}>
          <DistrictsBreadcrumb
            locale={locale}
            country={countrySlug}
            city={citySlug}
            district={district.slug}
            districtLabel={districtLabel}
          />
          <div className={MEASURE}>
            {shortLine ? (
              <p className="text-dark/75 dark:text-white/75 text-base font-semibold">
                {shortLine}
              </p>
            ) : null}
            <h1 className="lg:text-52 text-40 leading-[1.2] font-medium text-dark dark:text-white mt-2">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 text-lg leading-snug text-dark/50 dark:text-white/50 whitespace-pre-line">
                {subtitle}
              </p>
            ) : null}
            {heroCtaHref && heroCtaLabel ? (
              <a
                href={heroCtaHref}
                className={brandButtonClass("primary", "mt-8", "md")}
              >
                {heroCtaLabel}
              </a>
            ) : null}
          </div>
          {heroImageUrl || fallbackPhoto ? (
            <div className="mt-10 relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-dark/5 dark:bg-white/5">
              <Image
                src={heroImageUrl ?? fallbackPhoto!.src}
                alt={
                  heroImageUrl
                    ? district.heroImage?.alt || title
                    : tPhoto(fallbackPhoto!.key)
                }
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1023px) 100vw, 1280px"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Description */}
      {description ? (
        <section className="pt-12 md:pt-16">
          <div className={CONTAINER}>
            <p className={`${MEASURE} text-lg sm:text-xl leading-relaxed text-dark/80 dark:text-white/80 whitespace-pre-line`}>
              {description}
            </p>
          </div>
        </section>
      ) : null}

      {/* Gallery */}
      {galleryImages.length > 0 ? (
        <Section>
          <SectionHeading title={galleryTitle || undefined} lead={gallerySubtitle || undefined} />
          <ul className="grid grid-cols-12 gap-4 md:gap-6">
            {galleryImages.map((img, idx) => (
              <li
                key={img._key ?? idx}
                className={`group relative rounded-2xl overflow-hidden aspect-[4/3] bg-dark/5 dark:bg-white/5 ${galleryItemClass(idx, galleryImages.length)}`}
              >
                <Image
                  src={img.asset!.url!}
                  alt={img.alt || img.label || title}
                  fill
                  className="object-cover object-center will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {img.label ? (
                  <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-dark/65 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white/90">
                    {img.label}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* FAQ: the same block as on every landing */}
      {faqItems.length > 0 ? (
        <FAQ
          locale={locale}
          faqData={{
            title: faqTitle,
            items: faqItems.map((item) => ({ question: item.question, answer: item.answer })),
          }}
        />
      ) : null}

      {/* SEO text */}
      {seoText ? (
        <Section>
          <p className={`${MEASURE} ${SECTION_LEAD} text-base`}>{seoText}</p>
        </Section>
      ) : null}
    </>
  );
}
