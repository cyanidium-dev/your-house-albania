import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MarketingContentData } from "./types";
import { SPLIT_PRIMARY_FALLBACK, SPLIT_SECONDARY_FALLBACK } from "./types";
import { MarketingIntro } from "./MarketingIntro";

export function SplitVariant({
  locale,
  data,
}: {
  locale: string;
  data: MarketingContentData;
}) {
  const mode = data.mediaMode ?? "none";
  const customImages = (data.images ?? []).slice(0, 2);
  const hasCustom = mode === "custom" && customImages.length > 0;
  const useFallback = mode === "fallback";
  const showMediaColumn = hasCustom || useFallback;
  const mediaSideRight = data.mediaSide === "right";

  const benefits = data.benefits ?? [];

  if (!showMediaColumn) {
    return (
      <section className="py-16 md:py-24">
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
          <div className="max-w-3xl">
            <MarketingIntro
              locale={locale}
              theme="light"
              eyebrow={data.eyebrow}
              title={data.title}
              subtitle={data.subtitle}
              description={data.description}
              benefits={benefits}
              highlightsDisplay={data.highlightsDisplay}
              highlightCards={data.highlightCards}
              supportingText={data.supportingText}
              ctaLabel={data.ctaLabel}
              ctaHref={data.ctaHref}
              secondaryCtaLabel={data.secondaryCtaLabel}
              secondaryCtaHref={data.secondaryCtaHref}
              benefitItems={data.benefitItems}
              trustStripText={data.trustStripText}
            />
          </div>
        </div>
      </section>
    );
  }

  /** Matches `InvestmentSectionImpl` image column + copy column spacing (fallback media only). */
  if (useFallback) {
    const primaryAlt = data.title || "Marketing";
    const secondaryAlt = data.title || "Marketing";
    const mediaBlock = (
      <div className="grid grid-cols-2 gap-4">
        <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
          <Image
            src={SPLIT_PRIMARY_FALLBACK}
            alt={primaryAlt}
            fill
            className="object-cover object-center"
            sizes="25vw"
            unoptimized={false}
          />
        </div>
        <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
          <Image
            src={SPLIT_SECONDARY_FALLBACK}
            alt={secondaryAlt}
            fill
            className="object-cover object-center"
            sizes="25vw"
            unoptimized={false}
          />
        </div>
      </div>
    );
    const copyBlock = (
      <div className="flex flex-col justify-start gap-8">
        <MarketingIntro
          locale={locale}
          theme="light"
          eyebrow={data.eyebrow}
          title={data.title}
          subtitle={data.subtitle}
          description={data.description}
          benefits={benefits}
          highlightsDisplay={data.highlightsDisplay}
          highlightCards={data.highlightCards}
          supportingText={data.supportingText}
          ctaLabel={data.ctaLabel}
          ctaHref={data.ctaHref}
        />
      </div>
    );
    return (
      <section className="py-16 md:py-24">
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
          <div className="grid lg:grid-cols-2 gap-10">
            <div
              className={cn(
                "order-1 min-w-0",
                mediaSideRight ? "lg:order-2" : "lg:order-1",
              )}
            >
              {mediaBlock}
            </div>
            <div
              className={cn(
                "order-2 min-w-0",
                mediaSideRight ? "lg:order-1" : "lg:order-2",
              )}
            >
              {copyBlock}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const showPrimary = customImages[0];
  const showSecondary = customImages[1];

  const mediaBlock = (
    <div
      className={cn(
        "grid gap-4",
        showPrimary && showSecondary ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {showPrimary ? (
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden aspect-[320/386]",
            !showSecondary && "lg:col-span-2 max-w-lg mx-auto lg:max-w-none w-full",
          )}
        >
          <Image
            src={showPrimary.url}
            alt={showPrimary.alt || data.title || "Marketing"}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1023px) 100vw, 25vw"
            unoptimized={showPrimary.url.startsWith("http")}
          />
        </div>
      ) : null}
      {showSecondary ? (
        <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
          <Image
            src={showSecondary.url}
            alt={showSecondary.alt || data.title || "Marketing"}
            fill
            className="object-cover object-center"
            sizes="25vw"
            unoptimized={showSecondary.url.startsWith("http")}
          />
        </div>
      ) : null}
    </div>
  );

  const copyBlock = (
    <div className="flex flex-col justify-start gap-8 lg:px-4">
      <MarketingIntro
        locale={locale}
        theme="light"
        eyebrow={data.eyebrow}
        title={data.title}
        subtitle={data.subtitle}
        description={data.description}
        benefits={benefits}
        highlightsDisplay={data.highlightsDisplay}
        highlightCards={data.highlightCards}
        supportingText={data.supportingText}
        ctaLabel={data.ctaLabel}
        ctaHref={data.ctaHref}
      />
    </div>
  );

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div
            className={cn(
              "order-1 min-w-0",
              mediaSideRight ? "lg:order-2" : "lg:order-1",
            )}
          >
            {mediaBlock}
          </div>
          <div
            className={cn(
              "order-2 min-w-0",
              mediaSideRight ? "lg:order-1" : "lg:order-2",
            )}
          >
            {copyBlock}
          </div>
        </div>
      </div>
    </section>
  );
}
