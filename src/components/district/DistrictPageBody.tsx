import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { DistrictsBreadcrumb } from "@/components/shared/DistrictsBreadcrumb";
import { SectionHeader } from "@/components/landing/sectionPrimitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { DistrictDoc } from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";

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
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <DistrictsBreadcrumb
            locale={locale}
            country={countrySlug}
            city={citySlug}
            district={district.slug}
            districtLabel={districtLabel}
          />
          <div className="max-w-3xl">
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
                className="mt-8 inline-flex items-center justify-center py-4 px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white font-semibold text-sm"
              >
                {heroCtaLabel}
              </a>
            ) : null}
          </div>
          {heroImageUrl ? (
            <div className="mt-10 relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-dark/5 dark:bg-white/5">
              <Image
                src={heroImageUrl}
                alt={district.heroImage?.alt || title}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1023px) 100vw, 1280px"
                unoptimized={heroImageUrl.startsWith("http")}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Description */}
      {description ? (
        <section className="pt-12 md:pt-16">
          <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
            <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-dark/70 dark:text-white/70 whitespace-pre-line">
              {description}
            </p>
          </div>
        </section>
      ) : null}

      {/* Gallery */}
      {galleryImages.length > 0 ? (
        <section className="pt-16 md:pt-24">
          <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
            {galleryTitle || gallerySubtitle ? (
              <div className="mb-10 md:mb-12">
                <SectionHeader
                  variant="left"
                  title={galleryTitle || undefined}
                  subtitle={gallerySubtitle || undefined}
                  titleClassName="lg:text-52 text-40 font-medium text-dark dark:text-white leading-[1.2] mb-2"
                  subtitleClassName="text-dark/50 dark:text-white/50 text-lg leading-snug whitespace-pre-line max-w-3xl"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {galleryImages.map((img, idx) => (
                <div
                  key={img._key ?? idx}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-dark/5 dark:bg-white/5"
                >
                  <Image
                    src={img.asset!.url!}
                    alt={img.alt || img.label || title}
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={img.asset!.url!.startsWith("http")}
                  />
                  {img.label ? (
                    <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-dark/65 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white/90">
                      {img.label}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {faqItems.length > 0 ? (
        <section className="pt-16 md:pt-24">
          <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
            <h2 className="lg:text-52 text-40 leading-[1.2] font-medium text-dark dark:text-white mb-8">
              {faqTitle}
            </h2>
            <Accordion type="single" collapsible className="flex flex-col gap-3">
              {faqItems.map((item, idx) => (
                <AccordionItem key={item.key ?? idx} value={`faq-${idx}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      ) : null}

      {/* SEO text */}
      {seoText ? (
        <section className="pt-16 md:pt-24">
          <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
            <p className="text-sm leading-relaxed text-dark/50 dark:text-white/50 whitespace-pre-line">
              {seoText}
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
